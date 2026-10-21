import { Booking } from '../models/Booking.js';
import type { AuthUser } from '../middleware/auth.js';
import { sendNotification } from './notification.service.js';
import { AppError } from '../utils/AppError.js';
import { assertCanViewBooking } from '../utils/ownership.js';

const SESSION_MS = 60 * 60 * 1000; // fixed 60 minutes
const WARN_MS = 55 * 60 * 1000; // warning at 55 minutes

async function explainFailure(bookingId: string, trainerId: string, action: string): Promise<AppError> {
  const booking = await Booking.findById(bookingId);
  if (!booking) return new AppError(404, 'NOT_FOUND', 'Booking not found');
  if (booking.trainerId !== trainerId) return new AppError(403, 'FORBIDDEN', 'Not assigned to this session');
  return new AppError(
    409,
    'INVALID_STATUS',
    `Cannot ${action} a session that is ${booking.status.toLowerCase().replace('_', ' ')}`,
  );
}

/** Starts the session once. The database decides the start time, never the browser. */
export async function startSession(bookingId: string, trainerId: string) {
  const now = new Date();

  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, trainerId, status: { $in: ['CONFIRMED', 'ON_THE_WAY'] } },
    {
      $set: {
        status: 'IN_PROGRESS',
        'session.startedAt': now,
        'session.warnAt': new Date(now.getTime() + WARN_MS),
        'session.endsAt': new Date(now.getTime() + SESSION_MS),
      },
    },
    { returnDocument: 'after' },
  );

  if (!booking) throw await explainFailure(bookingId, trainerId, 'start');

  await sendNotification(
    booking.customerId,
    'SESSION_REMINDER',
    'Your workout session has started! Check the live timer in your dashboard.',
    booking._id.toString(),
  );

  return booking;
}

export async function markOnTheWay(bookingId: string, trainerId: string) {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, trainerId, status: 'CONFIRMED' },
    { $set: { status: 'ON_THE_WAY' } }, { returnDocument: 'after' },
  );
  if (!booking) throw await explainFailure(bookingId, trainerId, 'mark on the way');
  await sendNotification(booking.customerId, 'SESSION_REMINDER', 'Your trainer is on the way.', booking._id.toString());
  return booking;
}

/** Same ticker output as before, but only people who belong to the booking can read it. */
export async function getSessionTicker(bookingId: string, auth: AuthUser) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  assertCanViewBooking(booking, auth);

  const serverTime = new Date();
  const started = booking.session?.startedAt;
  const endsAt = booking.session?.endsAt;

  if (!started || !endsAt) {
    return {
      status: booking.status,
      serverTime,
      startedAt: null,
      endsAt: null,
      elapsedSeconds: 0,
      remainingSeconds: 0,
      is55MinWarning: false,
      isCompleted: booking.status === 'COMPLETED',
    };
  }

  const warnAt = booking.session?.warnAt ?? new Date(started.getTime() + WARN_MS);
  const remainingMs = Math.max(0, endsAt.getTime() - serverTime.getTime());
  const isTimeUp = serverTime.getTime() >= endsAt.getTime();
  let status = booking.status;

  // Lazy completion (a background job takes this over in Phase 15).
  if (isTimeUp && booking.status === 'IN_PROGRESS') {
    await Booking.updateOne(
      { _id: booking._id, status: 'IN_PROGRESS' },
      { $set: { status: 'COMPLETED', 'session.completeFiredAt': serverTime } },
    );
    status = 'COMPLETED';
  }

  return {
    status,
    serverTime,
    startedAt: started,
    endsAt,
    elapsedSeconds: Math.floor((serverTime.getTime() - started.getTime()) / 1000),
    remainingSeconds: Math.floor(remainingMs / 1000),
    is55MinWarning: serverTime.getTime() >= warnAt.getTime() && !isTimeUp,
    isCompleted: isTimeUp || status === 'COMPLETED',
  };
}

export async function completeSession(bookingId: string, trainerId: string) {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, trainerId, status: 'IN_PROGRESS' },
    { $set: { status: 'COMPLETED', 'session.completeFiredAt': new Date() } },
    { returnDocument: 'after' },
  );

  if (!booking) throw await explainFailure(bookingId, trainerId, 'complete');

  await sendNotification(
    booking.customerId,
    'SESSION_REMINDER',
    'Workout session completed! Review your trainer notes and session log.',
    booking._id.toString(),
  );

  return booking;
}
