import type { RequestHandler } from 'express';
import { getAvailableSlotsForDay, getEligibleTrainersForSlot, getInstantOptions } from '../services/slots.service.js';
import { requireObjectId } from '../utils/ids.js';

export const getDaySlots: RequestHandler = async (req, res) => {
  const societyId = requireObjectId(req.query['societyId'], 'Society');
  const dateStr = typeof req.query['date'] === 'string' ? req.query['date'] : new Date().toISOString();
  const preferredTrainerId = typeof req.query['preferredTrainerId'] === 'string' ? req.query['preferredTrainerId'] : undefined;

  const slots = await getAvailableSlotsForDay(societyId, dateStr, preferredTrainerId);
  res.json({ slots });
};

export const getInstantSlotOptions: RequestHandler = async (req, res) => {
  const societyId = requireObjectId(req.query['societyId'], 'Society');
  const options = await getInstantOptions(societyId);
  res.json({ options });
};

export const getEligibleTrainers: RequestHandler = async (req, res) => {
  const societyId = requireObjectId(req.query['societyId'], 'Society');
  const startAtStr = typeof req.query['startAt'] === 'string' ? req.query['startAt'] : '';
  const startAt = new Date(startAtStr);

  const trainers = await getEligibleTrainersForSlot(societyId, startAt);
  res.json({ trainers });
};