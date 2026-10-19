import type { RequestHandler } from 'express';
import { z } from 'zod';
import { SessionRecord } from '../models/SessionRecord.js';
import { Booking } from '../models/Booking.js';
import { generateWorkoutRecommendation } from '../services/ai.service.js';
import { AppError } from '../utils/AppError.js';

const createRecordSchema = z.object({
  bookingId: z.string().min(1),
  durationMinutes: z.number().default(60),
  exercises: z.array(
    z.object({
      name: z.string().min(1),
      sets: z.number().min(1),
      reps: z.number().optional(),
      weightKg: z.number().optional(),
    }),
  ),
  trainerNotes: z.string().optional(),
  suggestedNextWorkout: z.string().optional(),
});

const feedbackSchema = z.object({
  customerRating: z.number().min(1).max(5),
  customerFeedback: z.string().optional(),
});

export const postSessionRecord: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const body = createRecordSchema.parse(req.body);

  const booking = await Booking.findById(body.bookingId);
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  if (booking.trainerId !== req.auth.id) throw new AppError(403, 'FORBIDDEN', 'Only assigned trainer can submit logs');

  const record = await SessionRecord.findOneAndUpdate(
    { bookingId: body.bookingId },
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

export const postCustomerFeedback: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const bookingId = req.params['bookingId'];
  if (!bookingId || typeof bookingId !== 'string') throw new AppError(400, 'MISSING_ID', 'Booking ID required');

  const { customerRating, customerFeedback } = feedbackSchema.parse(req.body);

  const record = await SessionRecord.findOneAndUpdate(
    { bookingId },
    { $set: { customerRating, customerFeedback } },
    { returnDocument: 'after' },
  );

  if (!record) throw new AppError(404, 'NOT_FOUND', 'Session record not found');

  res.json({ record });
};

export const getRecordByBooking: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const bookingId = req.params['bookingId'];
  if (!bookingId || typeof bookingId !== 'string') throw new AppError(400, 'MISSING_ID', 'Booking ID required');

  const record = await SessionRecord.findOne({ bookingId });
  res.json({ record });
};

export const getAiRecommendation: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const recommendation = await generateWorkoutRecommendation(req.auth.id);
  res.json({ recommendation });
};