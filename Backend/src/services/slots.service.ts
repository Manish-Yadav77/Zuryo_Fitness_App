import { Society } from '../models/Society.js';
import { TrainerProfile } from '../models/TrainerProfile.js';
import { SlotLock } from '../models/SlotLock.js';
import { getSessionAtoms, parseTimeToMinutes } from './time.js';
import { getIstWeekdayAndMinutes } from './peak.js';

export interface TimeSlotOption {
  startAt: string;
  endAt: string;
  label: string;
  availableTrainersCount: number;
  isPeak: boolean;
}

export async function getAvailableSlotsForDate(societyId: string, dateStr: string) {
  const society = await Society.findById(societyId);
  if (!society) return [];

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr ?? '2026', 10);
  const month = parseInt(monthStr ?? '10', 10) - 1;
  const day = parseInt(dayStr ?? '20', 10);

  const trainers = await TrainerProfile.find({ zoneIds: society.zoneId, isActive: true });
  const slots: TimeSlotOption[] = [];

  for (let hour = 6; hour <= 20; hour++) {
    for (const minute of [0, 30]) {
      const slotStart = new Date(Date.UTC(year, month, day, hour - 5, minute - 30));
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

      let freeCount = 0;
      const atoms = getSessionAtoms(slotStart);

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

        const locked = await SlotLock.countDocuments({
          trainerId: t.userId,
          atomStart: { $in: atoms },
        });
        if (locked === 0) freeCount++;
      }

      const labelFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      slots.push({
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        label: labelFormatter.format(slotStart),
        availableTrainersCount: freeCount,
        isPeak: false,
      });
    }
  }

  return slots;
}

export async function getInstantOptions(societyId: string) {
  const society = await Society.findById(societyId);
  if (!society) return [];

  const now = new Date();
  const minStart = new Date(now.getTime() + 10 * 60 * 1000);
  const nextAtom = new Date(Math.ceil(minStart.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));

  const options: TimeSlotOption[] = [];
  const trainers = await TrainerProfile.find({ zoneIds: society.zoneId, isActive: true });

  for (let offsetMinutes = 0; offsetMinutes <= 45; offsetMinutes += 15) {
    const slotStart = new Date(nextAtom.getTime() + offsetMinutes * 60 * 1000);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
    const atoms = getSessionAtoms(slotStart);

    let freeCount = 0;
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

      const locked = await SlotLock.countDocuments({
        trainerId: t.userId,
        atomStart: { $in: atoms },
      });
      if (locked === 0) freeCount++;
    }

    const labelFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    options.push({
      startAt: slotStart.toISOString(),
      endAt: slotEnd.toISOString(),
      label: labelFormatter.format(slotStart),
      availableTrainersCount: freeCount,
      isPeak: false,
    });
  }

  return options;
}