import { Society } from '../models/Society.js';
import { TrainerProfile } from '../models/TrainerProfile.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';

import { calculateHaversineDistance } from '../utils/geo.js';
import { getSessionAtoms, parseTimeToMinutes } from './time.js';

export interface EvaluatedCandidate {
  trainerId: string;
  trainerName: string;
  distanceKm: number;
  sessionsToday: number;
  rating: number;
  eligible: boolean;
  reason?: string;
}

export interface SelectionResult {
  candidates: EvaluatedCandidate[];
  chosenTrainerId?: string;
  preferredHonored: boolean;
}

export async function findBestTrainerForSlot(
  societyId: string,
  slotStart: Date,
  preferredTrainerId?: string,
): Promise<SelectionResult> {
  const society = await Society.findById(societyId);
  if (!society) {
    return { candidates: [], preferredHonored: false };
  }

  const trainers = await TrainerProfile.find({ zoneIds: society.zoneId, isActive: true });
  const atoms = getSessionAtoms(slotStart);

  const startOfDay = new Date(slotStart);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(slotStart);
  endOfDay.setHours(23, 59, 59, 999);

  const evaluated: EvaluatedCandidate[] = [];

  for (const t of trainers) {
    const user = await User.findById(t.userId);
    const trainerName = user ? user.name : 'Trainer';
    const distanceKm = calculateHaversineDistance(
      society.location.lat,
      society.location.lng,
      t.baseLocation.lat,
      t.baseLocation.lng,
    );

    const sessionsToday = await Booking.countDocuments({
      trainerId: t.userId,
      startAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'] },
    });

    let eligible = true;
    let reason: string | undefined;

    // 1. Check weekly availability
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(slotStart);
    let weekdayStr = '';
    let hour = 0;
    let minute = 0;
    for (const p of parts) {
      if (p.type === 'weekday') weekdayStr = p.value;
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
    }
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const currentDay = dayMap[weekdayStr] ?? 0;
    const startM = hour * 60 + minute;
    const endM = startM + 60;

    const covers = t.weeklyAvailability.some((w) => {
      if (w.weekday !== currentDay) return false;
      const wStart = parseTimeToMinutes(w.start);
      const wEnd = parseTimeToMinutes(w.end);
      return startM >= wStart && endM <= wEnd;
    });

    if (!covers) {
      eligible = false;
      reason = 'Outside working hours';
    }

    // 2. Check time off blocks
    if (eligible) {
      const isOff = t.timeOff.some((to) => slotStart >= to.from && slotStart < to.to);
      if (isOff) {
        eligible = false;
        reason = 'On time off';
      }
    }

    // 3. Check existing slot locks
    if (eligible) {
      const lockedCount = await SlotLock.countDocuments({
        trainerId: t.userId,
        atomStart: { $in: atoms },
      });
      if (lockedCount > 0) {
        eligible = false;
        reason = 'Already booked for this slot';
      }
    }

    evaluated.push({
      trainerId: t.userId,
      trainerName,
      distanceKm,
      sessionsToday,
      rating: t.rating,
      eligible,
      reason,
    });
  }

  const eligibleCandidates = evaluated.filter((c) => c.eligible);

  if (eligibleCandidates.length === 0) {
    return { candidates: evaluated, preferredHonored: false };
  }

  // Preferred trainer check
  if (preferredTrainerId) {
    const pref = eligibleCandidates.find((c) => c.trainerId === preferredTrainerId);
    if (pref) {
      return {
        candidates: evaluated,
        chosenTrainerId: pref.trainerId,
        preferredHonored: true,
      };
    }
  }

  // Sort eligible trainers by: 1. Distance, 2. Fewest sessions today, 3. Rating (descending)
  eligibleCandidates.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (a.sessionsToday !== b.sessionsToday) return a.sessionsToday - b.sessionsToday;
    return b.rating - a.rating;
  });

  const best = eligibleCandidates[0];
  return {
    candidates: evaluated,
    chosenTrainerId: best ? best.trainerId : undefined,
    preferredHonored: false,
  };
}