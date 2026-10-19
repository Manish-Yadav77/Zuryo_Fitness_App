import type { Society } from './society';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CustomerProfile {
  userId: string;
  societyId: Society | string;
  flatNumber?: string;
  phone?: string;
}

export interface FitnessAssessment {
  _id: string;
  customerId: string;
  version: number;
  age: number;
  weightKg: number;
  goals: string[];
  level: FitnessLevel;
  preferences: string[];
  limitations?: string;
  createdAt: string;
}

export interface AssessmentResponse {
  profile: CustomerProfile | null;
  assessment: FitnessAssessment | null;
}

export interface SaveAssessmentPayload {
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