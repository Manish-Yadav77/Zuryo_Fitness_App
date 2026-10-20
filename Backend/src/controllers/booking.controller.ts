import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Booking } from '../models/Booking.js';
import { AssignmentDecision } from '../models/AssignmentDecision.js';
import { createBooking } from '../services/booking.service.js';
import { AppError } from '../utils/AppError.js';
import { requireObjectId } from '../utils/ids.js';
import { assertCanViewBooking } from '../utils/ownership.js';

const createBookingSchema = z.object({
  societyId: z.string().min(1, 'Society selection is required'),
  mode: z.enum(['INSTANT', 'SCHEDULED']),
  startAt: z.string().datetime(),
  preferredTrainerId: z.string().optional(),
});

export const postBooking: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');

  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
  const body = createBookingSchema.parse(req.body);

  const booking = await createBooking({
    customerId: req.auth.id,
    societyId: body.societyId,
    mode: body.mode,
    startAt: new Date(body.startAt),
    preferredTrainerId: body.preferredTrainerId,
    idempotencyKey,
  });

  res.status(201).json({ booking });
};

export const getMyBookings: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');

  const bookings = await Booking.find({ customerId: req.auth.id }).populate('societyId').sort({ startAt: -1 });

  res.json({ bookings });
};

export const getAssignedBookings: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');

  const bookings = await Booking.find({ trainerId: req.auth.id }).populate('societyId').sort({ startAt: -1 });

  res.json({ bookings });
};

export const getAllBookingsAdmin: RequestHandler = async (_req, res) => {
  const bookings = await Booking.find({}).populate('societyId').sort({ createdAt: -1 });
  res.json({ bookings });
};

export const getAssignmentDecisionsAdmin: RequestHandler = async (_req, res) => {
  const decisions = await AssignmentDecision.find({}).populate('societyId').sort({ createdAt: -1 }).limit(50);
  res.json({ decisions });
};

export const getBookingById: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');

  const id = requireObjectId(req.params['id'], 'Booking');
  const booking = await Booking.findById(id).populate('societyId');
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');

  assertCanViewBooking(booking, req.auth);

  res.json({ booking });
};