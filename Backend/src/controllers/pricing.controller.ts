import type { RequestHandler } from 'express';
import { z } from 'zod';
import { calculateQuoteForDate, getPricingConfig, updatePricingConfig } from '../services/pricing.service.js';
import { AppError } from '../utils/AppError.js';

const updatePricingSchema = z.object({
  normalPaise: z.number().min(100),
  peakPaise: z.number().min(100),
  commissionPercent: z.number().min(0).max(100),
});

export const getConfig: RequestHandler = async (_req, res) => {
  const config = await getPricingConfig();
  res.json({ config });
};

export const putConfig: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const body = updatePricingSchema.parse(req.body);
  const updated = await updatePricingConfig(body);
  res.json({ config: updated });
};

export const getQuote: RequestHandler = async (req, res) => {
  const dateStr = req.query['date'] as string | undefined;
  const date = dateStr ? new Date(dateStr) : new Date();
  const quote = await calculateQuoteForDate(date);
  res.json({ quote });
};