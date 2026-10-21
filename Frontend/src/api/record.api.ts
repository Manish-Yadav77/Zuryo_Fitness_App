import { api } from './client';
import type { AiWorkoutRecommendation, ExerciseItem, SessionRecord } from '@/types/record';

export const recordApi = {
  async saveLog(payload: {
    bookingId: string;
    durationMinutes?: number;
    exercises: ExerciseItem[];
    trainerNotes?: string;
    suggestedNextWorkout?: string;
  }): Promise<SessionRecord> {
    const { data } = await api.post<{ record: SessionRecord }>('/records', payload);
    return data.record;
  },
  async getByBooking(bookingId: string): Promise<SessionRecord | null> {
    const { data } = await api.get<{ record: SessionRecord | null }>(`/records/booking/${bookingId}`);
    return data.record;
  },
  async getMine(): Promise<SessionRecord[]> {
    const { data } = await api.get<{ records: SessionRecord[] }>('/records/mine');
    return data.records;
  },
  async submitFeedback(bookingId: string, rating: number, feedback?: string): Promise<SessionRecord> {
    const { data } = await api.post<{ record: SessionRecord }>(`/records/booking/${bookingId}/feedback`, {
      customerRating: rating,
      customerFeedback: feedback,
    });
    return data.record;
  },
  async getAiRecommendation(): Promise<AiWorkoutRecommendation> {
    const { data } = await api.get<{ recommendation: AiWorkoutRecommendation }>('/records/ai-recommendation');
    return data.recommendation;
  },
};