import type { RequestHandler } from 'express';
import { z } from 'zod';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/payment.service.js';
import { AppError } from '../utils/AppError.js';

const orderSchema = z.object({
  bookingId: z.string().optional(),
  packageTemplateId: z.string().optional(),
});

const verifySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const postCreateOrder: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const body = orderSchema.parse(req.body);
  const order = await createRazorpayOrder(req.auth.id, body.bookingId, body.packageTemplateId);
  res.status(201).json({ order });
};

export const postVerifyPayment: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const { orderId, paymentId, signature } = verifySchema.parse(req.body);
  const payment = await verifyPaymentSignature(orderId, paymentId, signature);
  res.json({ payment });
};