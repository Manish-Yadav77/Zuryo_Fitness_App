import { Schema, model } from 'mongoose';

export const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type FitnessLevel = (typeof FITNESS_LEVELS)[number];

export interface IFitnessAssessment {
  customerId: string;
  version: number;
  age: number;
  weightKg: number;
  goals: string[];
  level: FitnessLevel;
  preferences: string[];
  limitations?: string;
}

const fitnessAssessmentSchema = new Schema<IFitnessAssessment>(
  {
    customerId: { type: String, required: true, index: true },
    version: { type: Number, required: true, default: 1 },
    age: { type: Number, required: true, min: 10, max: 100 },
    weightKg: { type: Number, required: true, min: 20, max: 300 },
    goals: [{ type: String, required: true }],
    level: { type: String, enum: FITNESS_LEVELS, required: true },
    preferences: [{ type: String }],
    limitations: { type: String, trim: true },
  },
  { timestamps: true },
);

fitnessAssessmentSchema.index({ customerId: 1, version: -1 });

export const FitnessAssessment = model<IFitnessAssessment>('FitnessAssessment', fitnessAssessmentSchema);