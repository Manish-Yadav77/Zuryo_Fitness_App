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

const IST_DAY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export async function getAvailableSlotsForDay(
  societyId: string,
  dateStr: string,
  preferredTrainerId?: string
) {
  const society = await Society.findById(societyId);
  if (!society) return [];

  const dayKey = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? dateStr
    : IST_DAY_FORMAT.format(new Date(dateStr));
  const dayStart = new Date(`${dayKey}T00:00:00+05:30`);
  const dayEnd = new Date(`${dayKey}T23:59:59.999+05:30`);

  const now = new Date();
  const minStart = new Date(now.getTime() + 10 * 60 * 1000);

  const trainers = await TrainerProfile.find({ zoneIds: society.zoneId, isActive: true }).lean();
  if (trainers.length === 0) return [];

  const trainerUserIds = trainers.map((t) => t.userId);

  const locks = await SlotLock.find({
    trainerId: { $in: trainerUserIds },
    atomStart: { $gte: dayStart, $lte: dayEnd },
  }).lean();

  const lockedSet = new Set<string>();
  for (const lock of locks) {
    const timeMs = new Date(lock.atomStart).getTime();
    lockedSet.add(`${lock.trainerId}_${timeMs}`);
  }

  const slots: TimeSlotOption[] = [];

  for (let hour = 6; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 15) {
      if (hour === 21 && min > 0) break;

      const slotStart = new Date(dayStart.getTime() + (hour * 60 + min) * 60_000);

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

        const isOff = t.timeOff.some((to) => {
          const fromTime = new Date(to.from).getTime();
          const toTime = new Date(to.to).getTime();
          const slotTime = slotStart.getTime();
          return slotTime >= fromTime && slotTime < toTime;
        });
        if (isOff) continue;

        const isLocked = atoms.some((atom) => lockedSet.has(`${t.userId}_${atom.getTime()}`));
        if (isLocked) continue;

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

export async function getEligibleTrainersForSlot(
  societyId: string,
  startAt: Date
): Promise<EligibleTrainerInfo[]> {
  const society = await Society.findById(societyId);
  if (!society) return [];

  const trainers = await TrainerProfile.find({ zoneIds: society.zoneId, isActive: true }).lean();
  if (trainers.length === 0) return [];

  const trainerUserIds = trainers.map((t) => t.userId);
  const atoms = getSessionAtoms(startAt);

  const [users, locks] = await Promise.all([
    User.find({ _id: { $in: trainerUserIds } }).select('name').lean(),
    SlotLock.find({
      trainerId: { $in: trainerUserIds },
      atomStart: { $in: atoms },
    }).lean(),
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));
  const lockedTrainerIds = new Set(locks.map((l) => l.trainerId));

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

    const isOff = t.timeOff.some((to) => {
      const fromTime = new Date(to.from).getTime();
      const toTime = new Date(to.to).getTime();
      const slotTime = startAt.getTime();
      return slotTime >= fromTime && slotTime < toTime;
    });
    if (isOff) continue;

    if (lockedTrainerIds.has(t.userId)) continue;

    const distanceKm = calculateHaversineDistance(
      society.location.lat,
      society.location.lng,
      t.baseLocation.lat,
      t.baseLocation.lng
    );

    eligible.push({
      trainerId: t.userId,
      name: userMap.get(t.userId) ?? 'Trainer',
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
    const { minutes } = getIstWeekdayAndMinutes(curr);
    if (minutes >= 360 && minutes <= 1260) {
      const trainers = await getEligibleTrainersForSlot(societyId, curr);
      if (trainers.length > 0) {
        options.push({
          startAt: new Date(curr),
          endAt: new Date(curr.getTime() + 60 * 60 * 1000),
          availableTrainersCount: trainers.length,
          hasPreferredTrainer: false,
        });
      }
    }
    curr = new Date(curr.getTime() + 15 * 60 * 1000);
  }

  return options;
}