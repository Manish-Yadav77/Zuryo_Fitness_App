import { Booking } from '../models/Booking.js';
import { sendNotification } from './notification.service.js';
import { AppError } from '../utils/AppError.js';

export async function startSession(bookingId: string, trainerId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  if (booking.trainerId !== trainerId) throw new AppError(403, 'FORBIDDEN', 'Not assigned to this session');

  const now = new Date();
  const endsAt = new Date(now.getTime() + 60 * 60 * 1000); // Fixed 60 minutes
  const warnAt = new Date(now.getTime() + 55 * 60 * 1000); // 55-minute warning buzzer

  booking.status = 'IN_PROGRESS';
  booking.session = {
    startedAt: now,
    warnAt,
    endsAt,
  };

  await booking.save();

  await sendNotification(
    booking.customerId,
    'SESSION_REMINDER',
    'Your workout session has started! Check the live timer in your dashboard.',
    booking._id.toString(),
  );

  return booking;
}

export async function getSessionTicker(bookingId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');

  const serverTime = new Date();

  if (!booking.session || !booking.session.startedAt || !booking.session.endsAt) {
    return {
      status: booking.status,
      serverTime,
      startedAt: null,
      endsAt: null,
      remainingSeconds: 0,
      is55MinWarning: false,
      isCompleted: booking.status === 'COMPLETED',
    };
  }

  const startedAt = booking.session.startedAt;
  const endsAt = booking.session.endsAt;
  const warnAt = booking.session.warnAt || new Date(startedAt.getTime() + 55 * 60 * 1000);

  const elapsedMs = serverTime.getTime() - startedAt.getTime();
  const remainingMs = Math.max(0, endsAt.getTime() - serverTime.getTime());
  const remainingSeconds = Math.floor(remainingMs / 1000);

  const is55MinWarning = serverTime >= warnAt && remainingSeconds > 0;
  const isCompleted = serverTime >= endsAt || booking.status === 'COMPLETED';

  // Auto-transition to COMPLETED if 60 minutes have elapsed
  if (isCompleted && booking.status === 'IN_PROGRESS') {
    booking.status = 'COMPLETED';
    booking.session.completeFiredAt = serverTime;
    await booking.save();
  }

  return {
    status: booking.status,
    serverTime,
    startedAt,
    endsAt,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    remainingSeconds,
    is55MinWarning,
    isCompleted,
  };
}

export async function completeSession(bookingId: string, trainerId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  if (booking.trainerId !== trainerId) throw new AppError(403, 'FORBIDDEN', 'Not assigned to this session');

  booking.status = 'COMPLETED';
  if (booking.session) {
    booking.session.completeFiredAt = new Date();
  }
  await booking.save();

  await sendNotification(
    booking.customerId,
    'SESSION_REMINDER',
    'Workout session completed! Review your trainer notes and session log.',
    booking._id.toString(),
  );

  return booking;
}