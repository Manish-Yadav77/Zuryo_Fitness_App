import type { RequestHandler } from 'express';
import { Society } from '../models/Society.js';

export const getSocieties: RequestHandler = async (_req, res) => {
  const societies = await Society.find({ isActive: true }).sort({ name: 1 });
  res.json({ societies });
};