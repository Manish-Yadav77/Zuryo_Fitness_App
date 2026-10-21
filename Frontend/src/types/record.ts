export interface ExerciseItem {
  name: string;
  sets: number;
  reps?: number;
  weightKg?: number;
}

export interface SessionRecord {
  _id: string;
  bookingId: string;
  customerId: string;
  trainerId: string;
  durationMinutes: number;
  exercises: ExerciseItem[];
  trainerNotes?: string;
  suggestedNextWorkout?: string;
  customerRating?: number;
  customerFeedback?: string;
  createdAt?: string;
}

export interface AiWorkoutRecommendation {
  workoutTitle: string;
  focusArea: string;
  warmUp: string[];
  mainCircuit: { exercise: string; sets: number; reps: number }[];
  coolDown: string[];
  coachNote: string;
  source: 'NVIDIA' | 'GEMINI' | 'RULES';
  model: string;
  latencyMs: number;
}
