export interface TimeSlotOption {
  startAt: string;
  endAt: string;
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