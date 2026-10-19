import { CustomerProfile } from '../models/CustomerProfile.js';
import { FitnessAssessment } from '../models/FitnessAssessment.js';
import type { FitnessLevel } from '../models/FitnessAssessment.js';

export interface SaveAssessmentInput {
  customerId: string;
  societyId: string;
  flatNumber?: string;
  phone?: string;
  age: number;
  weightKg: number;
  goals: string[];
  level: FitnessLevel;
  preferences: string[];
  limitations?: string;
}

export async function getLatestAssessment(customerId: string) {
  const profile = await CustomerProfile.findOne({ userId: customerId }).populate('societyId');
  const assessment = await FitnessAssessment.findOne({ customerId }).sort({ version: -1 });
  return { profile, assessment };
}

export async function saveAssessment(input: SaveAssessmentInput) {
  await CustomerProfile.updateOne(
    { userId: input.customerId },
    {
      $set: {
        societyId: input.societyId,
        flatNumber: input.flatNumber,
        phone: input.phone,
      },
    },
    { upsert: true },
  );

  const latest = await FitnessAssessment.findOne({ customerId: input.customerId }).sort({ version: -1 });
  const nextVersion = latest ? latest.version + 1 : 1;

  const newAssessment = await FitnessAssessment.create({
    customerId: input.customerId,
    version: nextVersion,
    age: input.age,
    weightKg: input.weightKg,
    goals: input.goals,
    level: input.level,
    preferences: input.preferences,
    limitations: input.limitations,
  });

  return newAssessment;
}