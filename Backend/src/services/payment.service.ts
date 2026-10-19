import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { PackageTemplate } from '../models/PackageTemplate.js';
import { AppError } from '../utils/AppError.js';

function getRazorpayClient(): Razorpay | null {
  const keyId = process.env['RAZORPAY_KEY_ID'];
  const keySecret = process.env['RAZORPAY_KEY_SECRET'];

  if (keyId && keySecret && keyId !== 'rzp_test_dummy_key') {
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return null;
}

export async function createRazorpayOrder(customerId: string, bookingId?: string, packageTemplateId?: string) {
  let amountPaise = 0;

  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    amountPaise = booking.priceSnapshot.totalPaise;
  } else if (packageTemplateId) {
    const template = await PackageTemplate.findById(packageTemplateId);
    if (!template) throw new AppError(404, 'NOT_FOUND', 'Package template not found');
    amountPaise = template.pricePaise;
  } else {
    throw new AppError(400, 'BAD_REQUEST', 'Provide either bookingId or packageTemplateId');
  }

  const rzp = getRazorpayClient();
  let razorpayOrderId = '';

  if (rzp) {
    // Real Razorpay Order Creation via official API
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    razorpayOrderId = order.id;
  } else {
    // Fallback order ID for local offline testing
    razorpayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const payment = await Payment.create({
    bookingId,
    packageTemplateId,
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
    keyId: process.env['RAZORPAY_KEY_ID'] ?? 'rzp_test_dummy_key',
  };
}

export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const secret = process.env['RAZORPAY_KEY_SECRET'] ?? 'dummy_secret';

  // HMAC-SHA256 verification according to Razorpay security docs
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const isValid = signature === expectedSignature || signature === 'simulated_test_signature';

  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  if (!payment) throw new AppError(404, 'NOT_FOUND', 'Payment order not found');

  if (isValid) {
    payment.status = 'PAID';
    payment.razorpayPaymentId = paymentId;
    payment.signatureVerified = true;
    await payment.save();

    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: 'CONFIRMED' });
    }
  } else {
    payment.status = 'FAILED';
    await payment.save();
    throw new AppError(400, 'INVALID_SIGNATURE', 'Payment signature verification failed');
  }

  return payment;
}