import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { CustomerPackage } from '../models/CustomerPackage.js';
import { PackageTemplate } from '../models/PackageTemplate.js';
import { PackageLedger } from '../models/PackageLedger.js';
import type { IPayment } from '../models/Payment.js';
import { AppError } from '../utils/AppError.js';

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}

export async function getPackagesForCustomer(customerId: string) {
  return CustomerPackage.find({ customerId }).sort({ expiresAt: 1 });
}

/**
 * Creates the package for a VERIFIED payment. Safe to call many times:
 * the unique index on paymentId guarantees one package per payment.
 */
export async function fulfilPackagePurchase(payment: HydratedDocument<IPayment>) {
  const existing = await CustomerPackage.findOne({ paymentId: payment._id });
  if (existing) return existing;

  const template = await PackageTemplate.findById(payment.packageTemplateId);
  if (!template || !template.isActive) {
    throw new AppError(404, 'NOT_FOUND', 'Package template not available');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + template.validityDays * 24 * 60 * 60 * 1000);

  try {
    return await CustomerPackage.create({
      customerId: payment.customerId,
      templateId: template._id,
      packageName: template.name,
      totalSessions: template.sessions,
      usedSessions: 0,
      purchasedAt: now,
      expiresAt,
      paymentId: payment._id,
    });
  } catch (err) {
    if (isDuplicateKey(err)) {
      const created = await CustomerPackage.findOne({ paymentId: payment._id });
      if (created) return created;
    }
    throw err;
  }
}

/** Atomically consumes one credit, choosing the soonest-expiring usable package by default. */
export async function consumePackageForBooking(
  customerId: string,
  bookingId: string,
  session: mongoose.ClientSession,
  requestedPackageId?: string,
) {
  const now = new Date();
  const eligibility = {
    customerId,
    expiresAt: { $gt: now },
    $expr: { $lt: ['$usedSessions', '$totalSessions'] },
  };
  const filter = requestedPackageId ? { ...eligibility, _id: requestedPackageId } : eligibility;
  const pkg = await CustomerPackage.findOneAndUpdate(filter, { $inc: { usedSessions: 1 } }, {
    session,
    sort: { expiresAt: 1 },
    returnDocument: 'after',
  });
  if (!pkg) throw new AppError(409, 'PACKAGE_UNAVAILABLE', 'No usable package credit is available');

  try {
    await PackageLedger.create([{ packageId: pkg._id, bookingId, type: 'CONSUME', sessionsCount: 1 }], { session });
  } catch (err) {
    if (isDuplicateKey(err)) throw new AppError(409, 'ALREADY_DEDUCTED', 'This booking already used a package credit');
    throw err;
  }
  return pkg;
}
