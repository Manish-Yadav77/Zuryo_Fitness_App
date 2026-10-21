import { Society } from '../models/Society.js';
import { TrainerProfile } from '../models/TrainerProfile.js';
import { SlotLock } from '../models/SlotLock.js';
import { User } from '../models/User.js';
import { ceilToAtom, getSessionAtoms, parseTimeToMinutes } from './time.js';
import { getIstWeekdayAndMinutes } from './peak.js';
import { calculateHaversineDistance } from '../utils/geo.js';

export interface TimeSlotOption {
  startAt: Date;
  endAt: Date;
  availableTrainersCount: number;
  hasPreferredTrainer: boolean;
}

export interface EligibleTrainerInfo {
  trainerId: string;
  name: string;
  rating: number;
  bio?: string;
  distanceKm: number;
}

export async function getAvailableSlotsForDay(societyId: string, dateStr: string, preferredTrainerId?: string) {
  const society = await Society.findById(societyId);
  if (!society) return [];

  const date = new Date(dateStr);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const now = new Date();
  const minStart = new Date(now.getTime() + 10 * 60 * 1000); // Minimum 10 mins buffer from current time

  const trainers = await TrainerProfile.find({ zoneIds: society.zoneId, isActive: true });
  const slots: TimeSlotOption[] = [];

  for (let hour = 6; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 15) {
      if (hour === 21 && min > 0) break;

      const slotStart = new Date(startOfDay);
      slotStart.setHours(hour, min, 0, 0);

      // Do not return past time slots
      if (slotStart < minStart) continue;

      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

      const atoms = getSessionAtoms(slotStart);
      let availableCount = 0;
      let preferredAvailable = false;

      for (const t of trainers) {
        const { weekday, minutes } = getIstWeekdayAndMinutes(slotStart);
        const endMinutes = minutes + 60;

        const covers = t.weeklyAvailability.some((w) => {
          if (w.weekday !== weekday) return false;
          const wStart = parseTimeToMinutes(w.start);
          const wEnd = parseTimeToMinutes(w.end);
          return minutes >= wStart && endMinutes <= wEnd;
        });
        if (!covers) continue;

        const isOff = t.timeOff.some((to) => slotStart >= to.from && slotStart < to.to);
        if (isOff) continue;

        const locked = await SlotLock.exists({ trainerId: t.userId, atomStart: { $in: atoms } });
        if (locked) continue;

        availableCount++;
        if (preferredTrainerId && t.userId === preferredTrainerId) {
          preferredAvailable = true;
        }
      }

      if (availableCount > 0) {
        slots.push({
          startAt: slotStart,
          endAt: slotEnd,
          availableTrainersCount: availableCount,
          hasPreferredTrainer: preferredAvailable,
        });
      }
    }
  }

  return slots;
}

export async function getEligibleTrainersForSlot(societyId: string, startAt: Date): Promise<EligibleTrainerInfo[]> {
  const society = await Society.findById(societyId);
  if (!society) return [];

  const trainers = await TrainerProfile.find({ zoneIds: society.zoneId, isActive: true });
  const atoms = getSessionAtoms(startAt);
  const eligible: EligibleTrainerInfo[] = [];

  for (const t of trainers) {
    const { weekday, minutes } = getIstWeekdayAndMinutes(startAt);
    const endMinutes = minutes + 60;

    const covers = t.weeklyAvailability.some((w) => {
      if (w.weekday !== weekday) return false;
      const wStart = parseTimeToMinutes(w.start);
      const wEnd = parseTimeToMinutes(w.end);
      return minutes >= wStart && endMinutes <= wEnd;
    });
    if (!covers) continue;

    const isOff = t.timeOff.some((to) => startAt >= to.from && startAt < to.to);
    if (isOff) continue;

    const locked = await SlotLock.exists({ trainerId: t.userId, atomStart: { $in: atoms } });
    if (locked) continue;

    const user = await User.findById(t.userId);
    const distanceKm = calculateHaversineDistance(
      society.location.lat,
      society.location.lng,
      t.baseLocation.lat,
      t.baseLocation.lng,
    );

    eligible.push({
      trainerId: t.userId,
      name: user?.name ?? 'Trainer',
      rating: t.rating,
      bio: t.bio,
      distanceKm,
    });
  }

  return eligible;
}

export async function getInstantOptions(societyId: string) {
  const now = new Date();
  const minStart = new Date(now.getTime() + 10 * 60 * 1000);
  const roundedStart = ceilToAtom(minStart);
  const maxStart = new Date(now.getTime() + 60 * 60 * 1000);

  const options: TimeSlotOption[] = [];
  let curr = new Date(roundedStart);

  while (curr <= maxStart) {
    const trainers = await getEligibleTrainersForSlot(societyId, curr);
    if (trainers.length > 0) {
      options.push({
        startAt: new Date(curr),
        endAt: new Date(curr.getTime() + 60 * 60 * 1000),
        availableTrainersCount: trainers.length,
        hasPreferredTrainer: false,
      });
    }
    curr = new Date(curr.getTime() + 15 * 60 * 1000);
  }

  return options;
}