import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { Booking } from '../models/Booking.js';
import { PackageTemplate } from '../models/PackageTemplate.js';
import { Payment } from '../models/Payment.js';
import type { PaymentPurpose } from '../models/Payment.js';
import { fulfilPackagePurchase } from './package.service.js';
import { AppError } from '../utils/AppError.js';

/** Razorpay signature = HMAC-SHA256(secret, "orderId|paymentId"), hex encoded. */
export function computeRazorpaySignature(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

/** Constant-time comparison. Anything that is not the exact HMAC (including test strings) is rejected. */
export function isValidRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const expected = Buffer.from(computeRazorpaySignature(orderId, paymentId, secret), 'utf8');
  const given = Buffer.from(signature, 'utf8');
  if (expected.length !== given.length) return false;
  return crypto.timingSafeEqual(expected, given);
}

function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, 'PAYMENTS_NOT_CONFIGURED', 'Payments are not configured on this server');
  }
  return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET };
}

export interface CreateOrderInput {
  bookingId?: string;
  packageTemplateId?: string;
}

export async function createPaymentOrder(customerId: string, input: CreateOrderInput) {
  const { bookingId, packageTemplateId } = input;
  if ((bookingId ? 1 : 0) + (packageTemplateId ? 1 : 0) !== 1) {
    throw new AppError(400, 'BAD_REQUEST', 'Provide exactly one of bookingId or packageTemplateId');
  }

  const { keyId, keySecret } = getRazorpayCredentials();

  let purpose: PaymentPurpose;
  let amountPaise: number;
  let receipt: string;

  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    // Same message for "missing" and "someone else's" so booking IDs cannot be probed.
    if (!booking || booking.customerId !== customerId) {
      throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    }
    if (booking.paymentMode !== 'PAYMENT') {
      throw new AppError(400, 'BAD_REQUEST', 'This booking is not paid by card or UPI');
    }
    if (!['PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status)) {
      throw new AppError(409, 'INVALID_STATUS', `A ${booking.status.toLowerCase()} booking cannot be paid`);
    }
    if (await Payment.exists({ bookingId: booking._id, status: 'PAID' })) {
      throw new AppError(409, 'ALREADY_PAID', 'This booking is already paid');
    }
    purpose = 'BOOKING';
    amountPaise = booking.priceSnapshot.totalPaise; // always from the server-side snapshot
    receipt = `bk_${booking._id.toString()}`;
  } else {
    const template = await PackageTemplate.findById(packageTemplateId);
    if (!template || !template.isActive) throw new AppError(404, 'NOT_FOUND', 'Package template not found');
    purpose = 'PACKAGE';
    amountPaise = template.pricePaise;
    receipt = `pk_${template._id.toString()}`;
  }

  let razorpayOrderId: string;
  try {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await client.orders.create({ amount: amountPaise, currency: 'INR', receipt });
    razorpayOrderId = order.id;
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'Could not start the payment. Please try again.');
  }

  const payment = await Payment.create({
    bookingId,
    packageTemplateId,
    purpose,
    customerId,
    razorpayOrderId,
    amountPaise,
    status: 'CREATED',
    signatureVerified: false,
  });

  return {
    paymentId: payment._id.toString(),
    orderId: razorpayOrderId,
    amountPaise,
    keyId,
  };
}

export interface VerifyInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

async function fulfilPayment(payment: InstanceType<typeof Payment>) {
  if (payment.purpose === 'PACKAGE') {
    const customerPackage = await fulfilPackagePurchase(payment);
    return { payment, package: customerPackage };
  }

  if (payment.bookingId) {
    // Phase 13 turns this into the real "unpaid hold becomes confirmed" step.
    await Booking.updateOne({ _id: payment.bookingId, status: 'PENDING_PAYMENT' }, { $set: { status: 'CONFIRMED' } });
  }
  return { payment, package: null };
}

export async function verifyPayment(customerId: string, input: VerifyInput) {
  const { orderId, paymentId, signature } = input;

  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  if (!payment || payment.customerId !== customerId) {
    throw new AppError(404, 'NOT_FOUND', 'Payment order not found');
  }

  // Retry of an already verified payment: return the same result, change nothing.
  if (payment.status === 'PAID') {
    if (payment.razorpayPaymentId !== paymentId) {
      throw new AppError(409, 'ALREADY_PAID', 'This order is already paid');
    }
    return fulfilPayment(payment);
  }
  if (payment.status !== 'CREATED') {
    throw new AppError(409, 'INVALID_STATUS', `This payment is ${payment.status.toLowerCase()}`);
  }

  const { keySecret } = getRazorpayCredentials();
  if (!isValidRazorpaySignature(orderId, paymentId, signature, keySecret)) {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Payment signature verification failed');
  }

  // Only one request can move CREATED to PAID, even if two verify calls arrive together.
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'CREATED' },
    { $set: { status: 'PAID', razorpayPaymentId: paymentId, signatureVerified: true } },
    { returnDocument: 'after' },
  );
  if (!claimed) {
    const latest = await Payment.findById(payment._id);
    if (latest && latest.status === 'PAID' && latest.razorpayPaymentId === paymentId) {
      return fulfilPayment(latest);
    }
    throw new AppError(409, 'INVALID_STATUS', 'This payment could not be verified');
  }

  return fulfilPayment(claimed);
}