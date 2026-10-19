import mongoose from 'mongoose';
import { CustomerPackage } from '../models/CustomerPackage.js';
import { PackageTemplate } from '../models/PackageTemplate.js';
import { PackageLedger } from '../models/PackageLedger.js';
import { AppError } from '../utils/AppError.js';

export async function getActivePackagesForCustomer(customerId: string) {
  const now = new Date();
  const packages = await CustomerPackage.find({
    customerId,
    expiresAt: { $gte: now },
  }).sort({ expiresAt: 1 });

  return packages.filter((p) => p.usedSessions < p.totalSessions);
}

export async function purchasePackage(customerId: string, templateId: string, paymentId?: string) {
  const template = await PackageTemplate.findById(templateId);
  if (!template || !template.isActive) {
    throw new AppError(404, 'NOT_FOUND', 'Package template not available');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + template.validityDays * 24 * 60 * 60 * 1000);

  const customerPkg = await CustomerPackage.create({
    customerId,
    templateId: template._id,
    packageName: template.name,
    totalSessions: template.sessions,
    usedSessions: 0,
    purchasedAt: now,
    expiresAt,
    paymentId,
  });

  return customerPkg;
}

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

    // Ledger entry prevents double deduction
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

    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
      throw new AppError(409, 'ALREADY_DEDUCTED', 'Session already deducted for this booking');
    }
    throw err;
  }
}