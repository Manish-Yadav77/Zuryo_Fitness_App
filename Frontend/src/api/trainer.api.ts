import { api } from './client';
import type { TrainerProfile, WeeklySlot } from '@/types/trainer';

export const trainerApi = {
  async getMine(): Promise<TrainerProfile> {
    const { data } = await api.get<{ profile: TrainerProfile }>('/trainer/me');
    return data.profile;
  },
  async updateAvailability(weeklyAvailability: WeeklySlot[]): Promise<TrainerProfile> {
    const { data } = await api.put<{ profile: TrainerProfile }>('/trainer/availability', { weeklyAvailability });
    return data.profile;
  },
  async addTimeOff(fromIso: string, toIso: string, reason?: string): Promise<TrainerProfile> {
    const { data } = await api.post<{ profile: TrainerProfile }>('/trainer/time-off', {
      from: fromIso,
      to: toIso,
      reason,
    });
    return data.profile;
  },
  async deleteTimeOff(timeOffId: string): Promise<TrainerProfile> {
    const { data } = await api.delete<{ profile: TrainerProfile }>(`/trainer/time-off/${timeOffId}`);
    return data.profile;
  },
};