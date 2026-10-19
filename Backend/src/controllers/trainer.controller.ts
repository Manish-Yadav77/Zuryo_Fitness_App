import type { RequestHandler } from 'express';
import { z } from 'zod';
import { addTimeOffBlock, getTrainerProfileByUserId, removeTimeOffBlock, updateWeeklyAvailability } from '../services/availability.service.js';
import { AppError } from '../utils/AppError.js';

const weeklySlotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format'),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format'),
});

const availabilitySchema = z.object({
  weeklyAvailability: z.array(weeklySlotSchema),
});

const timeOffSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  reason: z.string().optional(),
});

export const getMyProfile: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const profile = await getTrainerProfileByUserId(req.auth.id);
  res.json({ profile });
};

export const setAvailability: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const { weeklyAvailability } = availabilitySchema.parse(req.body);
  const profile = await updateWeeklyAvailability(req.auth.id, weeklyAvailability);
  res.json({ profile });
};

export const postTimeOff: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const { from, to, reason } = timeOffSchema.parse(req.body);
  const profile = await addTimeOffBlock(req.auth.id, new Date(from), new Date(to), reason);
  res.json({ profile });
};

export const deleteTimeOff: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = req.params['id'];
  if (!id || typeof id !== 'string') throw new AppError(400, 'MISSING_ID', 'Time-off ID is required');
  const profile = await removeTimeOffBlock(req.auth.id, id);
  res.json({ profile });
};