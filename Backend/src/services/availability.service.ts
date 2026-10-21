import { TrainerProfile } from '../models/TrainerProfile.js';
import type { WeeklySlot } from '../models/TrainerProfile.js';
import { parseTimeToMinutes } from './time.js';
import { AppError } from '../utils/AppError.js';
import { Booking } from '../models/Booking.js';

export async function getTrainerProfileByUserId(userId: string) {
  let profile = await TrainerProfile.findOne({ userId });
  if (!profile) {
    profile = await TrainerProfile.create({
      userId,
      zoneIds: ['zone-bangalore-south', 'zone-bangalore-east'],
      baseLocation: { lat: 12.9121, lng: 77.6445 },
      rating: 4.9,
      bio: 'Certified personal trainer specializing in functional fitness and strength.',
      isActive: true,
      weeklyAvailability: [
        { weekday: 1, start: '06:00', end: '12:00' },
        { weekday: 1, start: '16:00', end: '20:00' },
        { weekday: 2, start: '06:00', end: '12:00' },
        { weekday: 2, start: '16:00', end: '20:00' },
        { weekday: 3, start: '06:00', end: '12:00' },
        { weekday: 3, start: '16:00', end: '20:00' },
        { weekday: 4, start: '06:00', end: '12:00' },
        { weekday: 4, start: '16:00', end: '20:00' },
        { weekday: 5, start: '06:00', end: '12:00' },
        { weekday: 5, start: '16:00', end: '20:00' },
        { weekday: 6, start: '07:00', end: '12:00' },
      ],
      timeOff: [],
    });
  }
  return profile;
}

export async function updateWeeklyAvailability(userId: string, slots: WeeklySlot[]) {
  for (const slot of slots) {
    const startM = parseTimeToMinutes(slot.start);
    const endM = parseTimeToMinutes(slot.end);
    if (startM >= endM) {
      throw new AppError(400, 'INVALID_TIME_RANGE', `Start time (${slot.start}) must be before end time (${slot.end})`);
    }
  }

  const profile = await TrainerProfile.findOneAndUpdate(
    { userId },
    { $set: { weeklyAvailability: slots } },
    { returnDocument: 'after', upsert: true },
  );

  return profile;
}

export async function addTimeOffBlock(userId: string, from: Date, to: Date, reason?: string) {
  if (from >= to) {
    throw new AppError(400, 'INVALID_TIME_RANGE', 'Time-off start date must be before end date');
  }
  const conflict = await Booking.exists({ trainerId: userId, status: { $in: ['PENDING_PAYMENT', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS'] }, startAt: { $lt: to }, endAt: { $gt: from } });
  if (conflict) throw new AppError(409, 'BOOKING_CONFLICT', 'This time off overlaps an assigned booking');

  const profile = await TrainerProfile.findOneAndUpdate(
    { userId },
    { $push: { timeOff: { from, to, reason } } },
    { returnDocument: 'after', upsert: true },
  );

  return profile;
}

export async function removeTimeOffBlock(userId: string, timeOffId: string) {
  const profile = await TrainerProfile.findOneAndUpdate(
    { userId },
    { $pull: { timeOff: { _id: timeOffId } } },
    { returnDocument: 'after' },
  );

  return profile;
}
