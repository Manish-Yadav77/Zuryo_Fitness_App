import type { RequestHandler } from 'express';
import { z } from 'zod';
import { SessionRecord } from '../models/SessionRecord.js';
import { Booking } from '../models/Booking.js';
import { generateWorkoutRecommendation } from '../services/ai.service.js';
import { AppError } from '../utils/AppError.js';
import { requireObjectId } from '../utils/ids.js';
import { assertCanViewBooking } from '../utils/ownership.js';

const createRecordSchema = z.object({
  bookingId: z.string().min(1),
  durationMinutes: z.number().min(1).max(240).default(60),
  exercises: z.array(
    z.object({
      name: z.string().min(1),
      sets: z.number().min(1),
      reps: z.number().optional(),
      weightKg: z.number().optional(),
    }),
  ),
  trainerNotes: z.string().max(2000).optional(),
  suggestedNextWorkout: z.string().max(1000).optional(),
});

const feedbackSchema = z.object({
  customerRating: z.number().int().min(1).max(5),
  customerFeedback: z.string().max(1000).optional(),
});

/** Trainer saves the workout log. Only the assigned trainer, and only once the session has started. */
export const postSessionRecord: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const body = createRecordSchema.parse(req.body);
  const bookingId = requireObjectId(body.bookingId, 'Booking');

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.trainerId !== req.auth.id) {
    throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  }
  if (!['IN_PROGRESS', 'COMPLETED'].includes(booking.status)) {
    throw new AppError(409, 'INVALID_STATUS', 'You can log a workout after the session has started');
  }

  const record = await SessionRecord.findOneAndUpdate(
    { bookingId },
    {
      $set: {
        customerId: booking.customerId,
        trainerId: req.auth.id,
        durationMinutes: body.durationMinutes,
        exercises: body.exercises,
        trainerNotes: body.trainerNotes,
        suggestedNextWorkout: body.suggestedNextWorkout,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  res.status(201).json({ record });
};

/** Customer rates their own completed session. Works even if the trainer has not logged yet. */
export const postCustomerFeedback: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const bookingId = requireObjectId(req.params['bookingId'], 'Booking');
  const { customerRating, customerFeedback } = feedbackSchema.parse(req.body);

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.customerId !== req.auth.id) {
    throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  }
  if (booking.status !== 'COMPLETED') {
    throw new AppError(409, 'INVALID_STATUS', 'You can give feedback after the session is completed');
  }

  const record = await SessionRecord.findOneAndUpdate(
    { bookingId },
    {
      $set: { customerRating, customerFeedback },
      $setOnInsert: { customerId: booking.customerId, trainerId: booking.trainerId },
    },
    { upsert: true, returnDocument: 'after' },
  );

  res.json({ record });
};

export const getRecordByBooking: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const bookingId = requireObjectId(req.params['bookingId'], 'Booking');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  assertCanViewBooking(booking, req.auth);

  const record = await SessionRecord.findOne({ bookingId });
  res.json({ record });
};

export const getAiRecommendation: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const recommendation = await generateWorkoutRecommendation(req.auth.id);
  res.json({ recommendation });
};