import { Booking } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';
import { sendNotification } from './notification.service.js';

/** Reconciles expiring checkout holds and session lifecycle events. Safe to run repeatedly. */
export async function runTicker(now = new Date()) {
  const expired = await Booking.find({ status: 'PENDING_PAYMENT', holdExpiresAt: { $lte: now } }).select('_id');
  if (expired.length) {
    const ids = expired.map((b) => b._id);
    await Booking.updateMany({ _id: { $in: ids }, status: 'PENDING_PAYMENT' }, { $set: { status: 'EXPIRED' }, $unset: { holdExpiresAt: 1 } });
    await SlotLock.deleteMany({ bookingId: { $in: ids }, state: 'HELD' });
  }

  const completed = await Booking.find({ status: 'IN_PROGRESS', 'session.endsAt': { $lte: now }, 'session.completeFiredAt': { $exists: false } });
  for (const booking of completed) {
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'IN_PROGRESS', 'session.completeFiredAt': { $exists: false } },
      { $set: { status: 'COMPLETED', 'session.completeFiredAt': now } },
      { returnDocument: 'after' },
    );
    if (updated) await sendNotification(updated.customerId, 'SESSION_REMINDER', 'Workout session completed! Review your trainer notes and session log.', updated._id.toString());
  }

  const warnings = await Booking.find({ status: 'IN_PROGRESS', 'session.warnAt': { $lte: now }, 'session.warnFiredAt': { $exists: false }, 'session.endsAt': { $gt: now } });
  for (const booking of warnings) {
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'IN_PROGRESS', 'session.warnFiredAt': { $exists: false } },
      { $set: { 'session.warnFiredAt': now } }, { returnDocument: 'after' },
    );
    if (updated) {
      await Promise.all([
        sendNotification(updated.trainerId, 'SESSION_REMINDER', 'Five minutes remain in this workout session.', updated._id.toString()),
        sendNotification(updated.customerId, 'SESSION_REMINDER', 'Your workout has five minutes remaining.', updated._id.toString()),
      ]);
    }
  }
  return { expired: expired.length, completed: completed.length, warnings: warnings.length };
}
