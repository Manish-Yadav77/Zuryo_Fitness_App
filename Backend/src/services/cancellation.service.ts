import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';
import { CustomerPackage } from '../models/CustomerPackage.js';
import { PackageLedger } from '../models/PackageLedger.js';
import { sendNotification } from './notification.service.js';
import { findBestTrainerForSlot } from './assignment.service.js';
import { ceilToAtom, getSessionAtoms } from './time.js';
import { AppError } from '../utils/AppError.js';
import { formatIst } from '../utils/timeFormat.js';
import { Payment } from '../models/Payment.js';

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

    if (['CANCELLED', 'COMPLETED', 'IN_PROGRESS'].includes(booking.status)) {
      throw new AppError(400, 'INVALID_STATUS', `Cannot cancel a ${booking.status.toLowerCase()} booking`);
    }

    const now = new Date();
    const previousStatus = booking.status;
    const hoursUntilStart = (booking.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    const eligibleForRefund = hoursUntilStart >= CANCELLATION_WINDOW_HOURS || userId === booking.trainerId;
    let restoreCredit = false;
    if (booking.paymentMode === 'PACKAGE' && booking.packageId) {
      if (eligibleForRefund) {
        restoreCredit = true;
      }
    }

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

      await CustomerPackage.findByIdAndUpdate(booking.packageId, { $inc: { usedSessions: -1 } }, { session });
    }

    await SlotLock.deleteMany({ bookingId: booking._id }, { session });

    booking.status = 'CANCELLED';
    booking.cancelledAt = now;
    booking.cancelReason = reason ?? 'Cancelled by user';
    await booking.save({ session });

    let refunded = false;
    if (booking.paymentMode === 'PAYMENT' && eligibleForRefund && previousStatus !== 'PENDING_PAYMENT') {
      const payment = await Payment.findOne({ bookingId: booking._id, status: 'PAID' }).session(session);
      if (payment) {
        payment.status = 'REFUNDED';
        payment.refundedAt = now;
        payment.refundId = `demo_refund_${payment._id.toString()}`;
        await payment.save({ session });
        refunded = true;
      }
    }

    await session.commitTransaction();
    session.endSession();

    await sendNotification(
      booking.trainerId,
      'BOOKING_CANCELLED',
      `Booking for ${formatIst(booking.startAt)} was cancelled.`,
      booking._id.toString(),
    );

    await sendNotification(
      booking.customerId,
      'BOOKING_CANCELLED',
      `Your booking for ${formatIst(booking.startAt)} has been cancelled.${restoreCredit ? ' 1 package session restored.' : ''}`,
      booking._id.toString(),
    );

    return { booking, outcome: { refunded, creditRestored: restoreCredit, eligibleForRefund } };
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
  if (booking.rescheduleCount >= 2) throw new AppError(409, 'RESCHEDULE_LIMIT', 'A booking can be rescheduled at most twice');
  if (booking.startAt.getTime() - Date.now() < CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000) {
    throw new AppError(409, 'RESCHEDULE_WINDOW', 'Reschedule at least 2 hours before the session');
  }

  const roundedStart = ceilToAtom(newStartAt);
  const roundedEnd = new Date(roundedStart.getTime() + 60 * 60 * 1000);

  // Remove this booking's own locks before ranking so a short shift is not falsely considered busy.
  await SlotLock.deleteMany({ bookingId: booking._id });
  const selection = await findBestTrainerForSlot(
    booking.societyId.toString(),
    roundedStart,
    booking.preferredTrainerId,
  );

  if (!selection.chosenTrainerId) {
    // Restore the original locks when no candidate is available.
    await SlotLock.insertMany(getSessionAtoms(booking.startAt).map((atom) => ({ trainerId: booking.trainerId, atomStart: atom, bookingId: booking._id, state: 'CONFIRMED' as const })));
    throw new AppError(409, 'NO_TRAINER_AVAILABLE', 'No trainer available for the requested new time.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    await Promise.all([
      sendNotification(
      booking.customerId,
      'BOOKING_RESCHEDULED',
      `Your session has been rescheduled to ${formatIst(roundedStart)}.`,
      booking._id.toString(),
      ),
      sendNotification(booking.trainerId, 'BOOKING_RESCHEDULED', `Session rescheduled to ${formatIst(roundedStart)}.`, booking._id.toString()),
    ]);

    return booking;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}
