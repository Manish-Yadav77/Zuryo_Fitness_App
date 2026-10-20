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
): SelectionResult {
  const eligibleCandidates = candidates.filter((c) => c.eligible);

  if (eligibleCandidates.length === 0) {
    return { candidates, preferredHonored: false };
  }

  if (preferredTrainerId) {
    const pref = eligibleCandidates.find((c) => c.trainerId === preferredTrainerId);
    if (pref) {
      return {
        candidates,
        chosenTrainerId: pref.trainerId,
        preferredHonored: true,
      };
    }
  }

  const sorted = [...eligibleCandidates].sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (a.sessionsToday !== b.sessionsToday) return a.sessionsToday - b.sessionsToday;
    if (a.rating !== b.rating) return b.rating - a.rating;
    return a.trainerId.localeCompare(b.trainerId);
  });

  return {
    candidates,
    chosenTrainerId: sorted[0]?.trainerId,
    preferredHonored: false,
  };
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

  const { weekday, minutes: startM } = getIstWeekdayAndMinutes(slotStart);
  const endM = startM + 60;

  const startOfDay = new Date(slotStart);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(slotStart);
  endOfDay.setUTCHours(23, 59, 59, 999);

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

    const covers = t.weeklyAvailability.some((w) => {
      if (w.weekday !== weekday) return false;
      const wStart = parseTimeToMinutes(w.start);
      const wEnd = parseTimeToMinutes(w.end);
      return startM >= wStart && endM <= wEnd;
    });

    if (!covers) {
      eligible = false;
      reason = 'Outside working hours';
    }

    if (eligible) {
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      const isOff = t.timeOff.some((to) => slotStart < to.to && slotEnd > to.from);
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

  return rankCandidates(evaluated, preferredTrainerId);
}