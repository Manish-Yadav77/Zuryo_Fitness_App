import type { RequestHandler } from 'express';
import { PackageTemplate } from '../models/PackageTemplate.js';
import { getActivePackagesForCustomer } from '../services/package.service.js';
import { AppError } from '../utils/AppError.js';

export const getTemplates: RequestHandler = async (_req, res) => {
  const templates = await PackageTemplate.find({ isActive: true }).sort({ pricePaise: 1 });
  res.json({ templates });
};

export const getMyPackages: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const packages = await getActivePackagesForCustomer(req.auth.id);
  res.json({ packages });
};