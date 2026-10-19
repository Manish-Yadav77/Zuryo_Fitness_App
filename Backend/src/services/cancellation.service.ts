import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';
import { CustomerPackage } from '../models/CustomerPackage.js';
import { PackageLedger } from '../models/PackageLedger.js';
import { sendNotification } from './notification.service.js';
import { findBestTrainerForSlot } from './assignment.service.js';
import { ceilToAtom, getSessionAtoms } from './time.js';
import { AppError } from '../utils/AppError.js';

const CANCELLATION_WINDOW_HOURS = 2;

export async function cancelBooking(bookingId: string, userId: string, reason?: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');

    if (booking.customerId !== userId && booking.trainerId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You cannot cancel this booking');
    }

    if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
      throw new AppError(400, 'INVALID_STATUS', `Cannot cancel a ${booking.status.toLowerCase()} booking`);
    }

    // Check 2-hour window rule for customer cancellations
    const now = new Date();
    const hoursUntilStart = (booking.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    let restoreCredit = false;
    if (booking.paymentMode === 'PACKAGE' && booking.packageId) {
      if (hoursUntilStart >= CANCELLATION_WINDOW_HOURS || userId === booking.trainerId) {
        restoreCredit = true;
      }
    }

    // Restore package credit if applicable
    if (restoreCredit && booking.packageId) {
      await PackageLedger.create(
        [
          {
            packageId: booking.packageId,
            bookingId: booking._id,
            type: 'RESTORE',
            sessionsCount: 1,
          },
        ],
        { session },
      );

      await CustomerPackage.findByIdAndUpdate(
        booking.packageId,
        { $inc: { usedSessions: -1 } },
        { session },
      );
    }

    // Release slot locks
    await SlotLock.deleteMany({ bookingId: booking._id }, { session });

    booking.status = 'CANCELLED';
    booking.cancelledAt = now;
    booking.cancelReason = reason ?? 'Cancelled by user';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Notify trainer and customer
    await sendNotification(
      booking.trainerId,
      'BOOKING_CANCELLED',
      `Booking for ${booking.startAt.toLocaleString()} was cancelled.`,
      booking._id.toString(),
    );

    await sendNotification(
      booking.customerId,
      'BOOKING_CANCELLED',
      `Your booking for ${booking.startAt.toLocaleString()} has been cancelled.${restoreCredit ? ' 1 package session restored.' : ''}`,
      booking._id.toString(),
    );

    return booking;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function rescheduleBooking(bookingId: string, customerId: string, newStartAt: Date) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');

  if (booking.customerId !== customerId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not own this booking');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new AppError(400, 'INVALID_STATUS', 'Only confirmed bookings can be rescheduled');
  }

  const roundedStart = ceilToAtom(newStartAt);
  const roundedEnd = new Date(roundedStart.getTime() + 60 * 60 * 1000);

  const selection = await findBestTrainerForSlot(
    booking.societyId.toString(),
    roundedStart,
    booking.preferredTrainerId,
  );

  if (!selection.chosenTrainerId) {
    throw new AppError(409, 'NO_TRAINER_AVAILABLE', 'No trainer available for the requested new time.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete old locks
    await SlotLock.deleteMany({ bookingId: booking._id }, { session });

    // Create new locks
    const newAtoms = getSessionAtoms(roundedStart);
    const locks = newAtoms.map((atom) => ({
      trainerId: selection.chosenTrainerId!,
      atomStart: atom,
      bookingId: booking._id,
      state: 'CONFIRMED' as const,
    }));

    await SlotLock.insertMany(locks, { session });

    booking.trainerId = selection.chosenTrainerId;
    booking.startAt = roundedStart;
    booking.endAt = roundedEnd;
    booking.rescheduleCount += 1;
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    await sendNotification(
      booking.trainerId,
      'BOOKING_RESCHEDULED',
      `Session rescheduled to ${roundedStart.toLocaleString()}`,
      booking._id.toString(),
    );

    return booking;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}