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

export async function getActivePackagesForCustomer(customerId: string) {
  const now = new Date();
  const packages = await CustomerPackage.find({
    customerId,
    expiresAt: { $gte: now },
  }).sort({ expiresAt: 1 });

  return packages.filter((p) => p.usedSessions < p.totalSessions);
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

// NOTE: rewritten with atomic updates and wired to bookings in Phase 13.
export async function deductPackageSession(packageId: string, bookingId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const pkg = await CustomerPackage.findById(packageId).session(session);
    if (!pkg) throw new AppError(404, 'NOT_FOUND', 'Package not found');

    if (pkg.usedSessions >= pkg.totalSessions) {
      throw new AppError(400, 'PACKAGE_EXHAUSTED', 'No remaining sessions in this package');
    }

    if (new Date() > pkg.expiresAt) {
      throw new AppError(400, 'PACKAGE_EXPIRED', 'This package has expired');
    }

    await PackageLedger.create(
      [
        {
          packageId,
          bookingId,
          type: 'CONSUME',
          sessionsCount: 1,
        },
      ],
      { session },
    );

    pkg.usedSessions += 1;
    await pkg.save({ session });

    await session.commitTransaction();
    session.endSession();

    return pkg;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (isDuplicateKey(err)) {
      throw new AppError(409, 'ALREADY_DEDUCTED', 'Session already deducted for this booking');
    }
    throw err;
  }
}