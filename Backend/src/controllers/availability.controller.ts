import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getAvailableSlotsForDate, getInstantOptions } from '../services/slots.service.js';
import { findBestTrainerForSlot } from '../services/assignment.service.js';

const availabilityQuerySchema = z.object({
  societyId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

const instantQuerySchema = z.object({
  societyId: z.string().min(1),
});

const eligibleQuerySchema = z.object({
  societyId: z.string().min(1),
  startAt: z.string().datetime(),
});

export const getAvailability: RequestHandler = async (req, res) => {
  const { societyId, date } = availabilityQuerySchema.parse(req.query);
  const slots = await getAvailableSlotsForDate(societyId, date);
  res.json({ slots });
};

export const getInstantAvailability: RequestHandler = async (req, res) => {
  const { societyId } = instantQuerySchema.parse(req.query);
  const options = await getInstantOptions(societyId);
  res.json({ options });
};

export const getEligibleTrainers: RequestHandler = async (req, res) => {
  const { societyId, startAt } = eligibleQuerySchema.parse(req.query);
  const result = await findBestTrainerForSlot(societyId, new Date(startAt));
  res.json({ candidates: result.candidates, chosenTrainerId: result.chosenTrainerId });
};