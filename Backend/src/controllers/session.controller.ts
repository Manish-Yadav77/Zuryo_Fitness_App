import type { RequestHandler } from 'express';
import { completeSession, getSessionTicker, startSession } from '../services/session.service.js';
import { AppError } from '../utils/AppError.js';

export const postStartSession: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = req.params['id'];
  if (!id || typeof id !== 'string') throw new AppError(400, 'MISSING_ID', 'Booking ID required');

  const booking = await startSession(id, req.auth.id);
  res.json({ booking });
};

export const getTicker: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = req.params['id'];
  if (!id || typeof id !== 'string') throw new AppError(400, 'MISSING_ID', 'Booking ID required');

  const ticker = await getSessionTicker(id);
  res.json({ ticker });
};

export const postCompleteSession: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = req.params['id'];
  if (!id || typeof id !== 'string') throw new AppError(400, 'MISSING_ID', 'Booking ID required');

  const booking = await completeSession(id, req.auth.id);
  res.json({ booking });
};