import type { RequestHandler } from 'express';
import { completeSession, getSessionTicker, startSession } from '../services/session.service.js';
import { AppError } from '../utils/AppError.js';
import { requireObjectId } from '../utils/ids.js';

export const postStartSession: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = requireObjectId(req.params['id'], 'Booking');
  const booking = await startSession(id, req.auth.id);
  res.json({ booking });
};

export const getTicker: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = requireObjectId(req.params['id'], 'Booking');
  const ticker = await getSessionTicker(id, req.auth);
  res.json({ ticker });
};

export const postCompleteSession: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = requireObjectId(req.params['id'], 'Booking');
  const booking = await completeSession(id, req.auth.id);
  res.json({ booking });
};