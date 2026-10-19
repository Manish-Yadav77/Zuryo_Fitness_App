import type { RequestHandler } from 'express';
import { z } from 'zod';
import { PackageTemplate } from '../models/PackageTemplate.js';
import { getActivePackagesForCustomer, purchasePackage } from '../services/package.service.js';
import { AppError } from '../utils/AppError.js';

const purchaseSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  paymentId: z.string().optional(),
});

export const getTemplates: RequestHandler = async (_req, res) => {
  const templates = await PackageTemplate.find({ isActive: true }).sort({ pricePaise: 1 });
  res.json({ templates });
};

export const getMyPackages: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const packages = await getActivePackagesForCustomer(req.auth.id);
  res.json({ packages });
};

export const postPurchasePackage: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const { templateId, paymentId } = purchaseSchema.parse(req.body);
  const customerPkg = await purchasePackage(req.auth.id, templateId, paymentId);
  res.status(201).json({ package: customerPkg });
};