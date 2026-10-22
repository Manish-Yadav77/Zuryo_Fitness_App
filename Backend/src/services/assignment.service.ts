import { Society } from '../models/Society.js';
import { TrainerProfile } from '../models/TrainerProfile.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';
import { calculateHaversineDistance } from '../utils/geo.js';
import { getSessionAtoms, parseTimeToMinutes } from './time.js';
import { getIstWeekdayAndMinutes } from './peak.js';

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

export function rankCandidates(
  candidates: EvaluatedCandidate[],
  preferredTrainerId?: string,
): { chosenId?: string; chosenTrainerId?: string; preferredHonored: boolean } {
  const eligible = candidates.filter((c) => c.eligible);
  if (eligible.length === 0) return { preferredHonored: false };

  if (preferredTrainerId) {
    const pref = eligible.find((c) => c.trainerId === preferredTrainerId);
    if (pref) {
      return {
        chosenId: pref.trainerId,
        chosenTrainerId: pref.trainerId,
        preferredHonored: true,
      };
    }
  }

  eligible.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (a.sessionsToday !== b.sessionsToday) return a.sessionsToday - b.sessionsToday;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.trainerId.localeCompare(b.trainerId);
  });

  const chosen = eligible[0]?.trainerId;
  return {
    chosenId: chosen,
    chosenTrainerId: chosen,
    preferredHonored: false,
  };
}

export async function findBestTrainerForSlot(
  societyId: string,
  slotStart: Date,
  preferredTrainerId?: string,
): Promise<SelectionResult> {
  const society = await Society.findById(societyId);
  if (!society) return { candidates: [], preferredHonored: false };

  const trainers = await TrainerProfile.find({ zoneIds: society.zoneId, isActive: true });
  const atoms = getSessionAtoms(slotStart);

  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(slotStart);
  const startOfDay = new Date(`${dayKey}T00:00:00+05:30`);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

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
      startAt: { $gte: startOfDay,$lte: endOfDay },
      status: { $in: ['CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'] },
    });

    let eligible = true;
    let reason: string | undefined;

    const { weekday, minutes } = getIstWeekdayAndMinutes(slotStart);
    const endMinutes = minutes + 60;

    const covers = t.weeklyAvailability.some((w) => {
      if (w.weekday !== weekday) return false;
      const wStart = parseTimeToMinutes(w.start);
      const wEnd = parseTimeToMinutes(w.end);
      return minutes >= wStart && endMinutes <= wEnd;
    });

    if (!covers) {
      eligible = false;
      reason = 'Outside working hours';
    }

    if (eligible) {
      const isOff = t.timeOff.some((to) => slotStart >= to.from && slotStart < to.to);
      if (isOff) {
        eligible = false;
        reason = 'On time off';
      }
    }

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

  const { chosenTrainerId, preferredHonored } = rankCandidates(evaluated, preferredTrainerId);

  return {
    candidates: evaluated,
    chosenTrainerId,
    preferredHonored,
  };
}