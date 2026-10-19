import type { RequestHandler } from 'express';
import { z } from 'zod';
import { FITNESS_LEVELS } from '../models/FitnessAssessment.js';
import { getLatestAssessment, saveAssessment } from '../services/assessment.service.js';
import { AppError } from '../utils/AppError.js';

const saveAssessmentSchema = z.object({
  societyId: z.string().min(1, 'Please select your residential society'),
  flatNumber: z.string().optional(),
  phone: z.string().optional(),
  age: z.number().int().min(10, 'Age must be at least 10').max(100, 'Enter a valid age'),
  weightKg: z.number().min(20, 'Weight must be at least 20 kg').max(300, 'Enter a valid weight'),
  goals: z.array(z.string()).min(1, 'Select at least one fitness goal'),
  level: z.enum(FITNESS_LEVELS, { message: 'Select a valid experience level' }),
  preferences: z.array(z.string()).default([]),
  limitations: z.string().optional(),
});

export const getMyAssessment: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const data = await getLatestAssessment(req.auth.id);
  res.json(data);
};

export const submitAssessment: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const body = saveAssessmentSchema.parse(req.body);
  const assessment = await saveAssessment({ customerId: req.auth.id, ...body });
  res.status(201).json({ assessment });
};