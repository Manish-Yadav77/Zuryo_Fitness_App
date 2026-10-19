import { api } from './client';
import type { Society } from '@/types/society';

export const societyApi = {
  async getSocieties(): Promise<Society[]> {
    const { data } = await api.get<{ societies: Society[] }>('/societies');
    return data.societies;
  },
};