import { api } from './client';
import type { AppNotification } from '@/types/notification';

export const notificationsApi = {
  async getMine(): Promise<AppNotification[]> {
    const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications');
    return data.notifications;
  },
  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },
};