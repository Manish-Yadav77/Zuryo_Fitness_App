import type { RequestHandler } from 'express';
import { z } from 'zod';
import { calculateQuoteForDate, getActivePricingConfig } from '../services/pricing.service.js';

const quoteQuerySchema = z.object({
  startAt: z.string().datetime({ message: 'startAt must be a valid ISO 8601 string' }),
});

export const getPricingConfig: RequestHandler = async (_req, res) => {
  const config = await getActivePricingConfig();
  res.json({ config });
};

export const getQuote: RequestHandler = async (req, res) => {
  const { startAt } = quoteQuerySchema.parse(req.body);
  const quote = await calculateQuoteForDate(new Date(startAt));
  res.json({ quote });
};