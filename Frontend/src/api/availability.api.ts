import { api } from './client';
import type { EligibleTrainersResponse, TimeSlotOption } from '@/types/availability';

export const availabilityApi = {
  async getForDate(societyId: string, dateStr: string): Promise<TimeSlotOption[]> {
    const { data } = await api.get<{ slots: TimeSlotOption[] }>('/availability', {
      params: { societyId, date: dateStr },
    });
    return data.slots;
  },
  async getInstantOptions(societyId: string): Promise<TimeSlotOption[]> {
    const { data } = await api.get<{ options: TimeSlotOption[] }>('/availability/instant', {
      params: { societyId },
    });
    return data.options;
  },
  async getEligibleTrainers(societyId: string, startAtIso: string): Promise<EligibleTrainersResponse> {
    const { data } = await api.get<EligibleTrainersResponse>('/availability/trainers', {
      params: { societyId, startAt: startAtIso },
    });
    return data;
  },
};