export interface TimeSlotOption {
  startAt: string;
  endAt: string;
  label: string;
  availableTrainersCount: number;
  isPeak: boolean;
}

export interface CandidateEvaluation {
  trainerId: string;
  trainerName: string;
  distanceKm: number;
  sessionsToday: number;
  rating: number;
  eligible: boolean;
  reason?: string;
}

export interface EligibleTrainersResponse {
  candidates: CandidateEvaluation[];
  chosenTrainerId?: string;
}