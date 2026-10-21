import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import type { BookingMode } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';
import { AssignmentDecision } from '../models/AssignmentDecision.js';
import { findBestTrainerForSlot } from './assignment.service.js';
import { calculateQuoteForDate } from './pricing.service.js';
import { ceilToAtom, getSessionAtoms } from './time.js';
import { sendNotification } from './notification.service.js';
import { AppError } from '../utils/AppError.js';
import { formatIst } from '../utils/timeFormat.js';
import { consumePackageForBooking } from './package.service.js';

export interface CreateBookingInput {
  customerId: string;
  societyId: string;
  mode: BookingMode;
  startAt: Date;
  preferredTrainerId?: string;
  idempotencyKey?: string;
  paymentMode: 'PAYMENT' | 'PACKAGE';
  packageId?: string;
}

export async function createBooking(input: CreateBookingInput) {
  if (input.idempotencyKey) {
    const existing = await Booking.findOne({
      customerId: input.customerId,
      idempotencyKey: input.idempotencyKey,
    }).populate('societyId');
    if (existing) return existing;
  }

  const now = new Date();
  const minStart = new Date(now.getTime() + 10 * 60 * 1000);
  const maxHorizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (input.startAt < minStart) {
    throw new AppError(400, 'INVALID_SLOT_TIME', 'Booking must be made at least 10 minutes in advance');
  }
  if (input.startAt > maxHorizon) {
    throw new AppError(400, 'INVALID_SLOT_TIME', 'Bookings cannot be made more than 30 days in advance');
  }

  if (input.mode === 'INSTANT') {
    const maxInstantTime = new Date(now.getTime() + 60 * 60 * 1000);
    if (input.startAt > maxInstantTime) {
      throw new AppError(400, 'INVALID_INSTANT_SLOT', 'Instant bookings must start within 60 minutes');
    }
  }

  const roundedStart = ceilToAtom(input.startAt);
  const roundedEnd = new Date(roundedStart.getTime() + 60 * 60 * 1000);

  const overlappingCustomerBooking = await Booking.exists({
    customerId: input.customerId,
    status: { $in: ['PENDING_PAYMENT', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS'] },
    startAt: { $lt: roundedEnd },
    endAt: { $gt: roundedStart },
  });

  if (overlappingCustomerBooking) {
    throw new AppError(409, 'CUSTOMER_OVERLAP', 'You already have an active booking during this time slot');
  }

  const quote = await calculateQuoteForDate(roundedStart);
  const selection = await findBestTrainerForSlot(input.societyId, roundedStart, input.preferredTrainerId);

  if (!selection.chosenTrainerId) {
    await AssignmentDecision.create({
      requestedAt: now,
      slotStart: roundedStart,
      societyId: input.societyId,
      candidates: selection.candidates,
      outcome: 'NO_TRAINER',
    });
    throw new AppError(409, 'NO_TRAINER_AVAILABLE', 'No trainer is available for this slot. Try another time.');
  }

  const chosenTrainerId = selection.chosenTrainerId;
  const atoms = getSessionAtoms(roundedStart);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bookingDoc = new Booking({
      customerId: input.customerId,
      trainerId: chosenTrainerId,
      societyId: input.societyId,
      mode: input.mode,
      startAt: roundedStart,
      endAt: roundedEnd,
      status: input.paymentMode === 'PACKAGE' ? 'CONFIRMED' : 'PENDING_PAYMENT',
      paymentMode: input.paymentMode,
      holdExpiresAt: input.paymentMode === 'PAYMENT' ? new Date(now.getTime() + 10 * 60 * 1000) : undefined,
      priceSnapshot: {
        tier: quote.tier,
        sessionPaise: quote.sessionPaise,
        commissionPaise: quote.commissionPaise,
        totalPaise: quote.totalPaise,
        commissionPercent: quote.commissionPercent,
        configVersion: quote.configVersion,
      },
      preferredTrainerId: input.preferredTrainerId,
      preferredHonored: selection.preferredHonored,
      idempotencyKey: input.idempotencyKey,
    });

    await bookingDoc.save({ session });

    const locks = atoms.map((atom) => ({
      trainerId: chosenTrainerId,
      atomStart: atom,
      bookingId: bookingDoc._id,
      state: input.paymentMode === 'PACKAGE' ? ('CONFIRMED' as const) : ('HELD' as const),
      holdExpiresAt: input.paymentMode === 'PAYMENT' ? bookingDoc.holdExpiresAt : undefined,
    }));

    await SlotLock.insertMany(locks, { session });

    if (input.paymentMode === 'PACKAGE') {
      const pkg = await consumePackageForBooking(input.customerId, bookingDoc._id.toString(), session, input.packageId);
      bookingDoc.packageId = pkg._id.toString();
      await bookingDoc.save({ session });
    }

    await AssignmentDecision.create(
      [
        {
          bookingId: bookingDoc._id,
          requestedAt: now,
          slotStart: roundedStart,
          societyId: input.societyId,
          candidates: selection.candidates,
          chosenTrainerId,
          outcome: 'ASSIGNED',
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    if (input.paymentMode === 'PACKAGE') {
      await sendNotification(chosenTrainerId, 'BOOKING_ASSIGNED', `New workout session assigned for ${formatIst(roundedStart)}.`, bookingDoc._id.toString());
    }

    return bookingDoc;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
      throw new AppError(409, 'SLOT_ALREADY_BOOKED', 'The slot was just claimed by another booking. Please try again.');
    }
    throw err;
  }
}
