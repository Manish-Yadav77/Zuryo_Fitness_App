import type { RequestHandler } from 'express';
import { z } from 'zod';
import { createPaymentOrder, verifyPayment } from '../services/payment.service.js';
import { AppError } from '../utils/AppError.js';

const orderSchema = z
  .object({
    bookingId: z.string().min(1).optional(),
    packageTemplateId: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.bookingId) !== Boolean(v.packageTemplateId), {
    message: 'Provide exactly one of bookingId or packageTemplateId',
  });

const verifySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const postCreateOrder: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const body = orderSchema.parse(req.body);
  const order = await createPaymentOrder(req.auth.id, body);
  res.status(201).json({ order });
};

export const postVerifyPayment: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const input = verifySchema.parse(req.body);
  const result = await verifyPayment(req.auth.id, input);
  res.json({
    payment: {
      _id: result.payment._id.toString(),
      status: result.payment.status,
      amountPaise: result.payment.amountPaise,
      razorpayOrderId: result.payment.razorpayOrderId,
      razorpayPaymentId: result.payment.razorpayPaymentId,
    },
    package: result.package,
  });
};