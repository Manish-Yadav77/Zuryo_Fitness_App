import type { RequestHandler } from 'express';
import { z } from 'zod';
import { cancelBooking, rescheduleBooking } from '../services/cancellation.service.js';
import { AppError } from '../utils/AppError.js';

const cancelSchema = z.object({
  reason: z.string().optional(),
});

const rescheduleSchema = z.object({
  newStartAt: z.string().datetime(),
});

export const postCancelBooking: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = req.params['id'];
  if (!id || typeof id !== 'string') throw new AppError(400, 'MISSING_ID', 'Booking ID required');
  const { reason } = cancelSchema.parse(req.body);

  const booking = await cancelBooking(id, req.auth.id, reason);
  res.json({ booking });
};

export const postRescheduleBooking: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = req.params['id'];
  if (!id || typeof id !== 'string') throw new AppError(400, 'MISSING_ID', 'Booking ID required');
  const { newStartAt } = rescheduleSchema.parse(req.body);

  const booking = await rescheduleBooking(id, req.auth.id, new Date(newStartAt));
  res.json({ booking });
};