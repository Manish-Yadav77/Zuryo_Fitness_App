import { api } from './client';
import type { EligibleTrainerInfo, TimeSlotOption } from '@/types/availability';

export const availabilityApi = {
  async getDaySlots(societyId: string, dateStr: string, preferredTrainerId?: string): Promise<TimeSlotOption[]> {
    const { data } = await api.get<{ slots: TimeSlotOption[] }>('/availability/slots', {
      params: { societyId, date: dateStr, preferredTrainerId },
    });
    return data.slots;
  },
  async getInstantOptions(societyId: string): Promise<TimeSlotOption[]> {
    const { data } = await api.get<{ options: TimeSlotOption[] }>('/availability/instant', {
      params: { societyId },
    });
    return data.options;
  },
  async getEligibleTrainers(societyId: string, startAtIso: string): Promise<EligibleTrainerInfo[]> {
    const { data } = await api.get<{ trainers: EligibleTrainerInfo[] }>('/availability/trainers', {
      params: { societyId, startAt: startAtIso },
    });
    return data.trainers;
  },
};