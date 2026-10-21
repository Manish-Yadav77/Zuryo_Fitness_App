import { api } from './client';
import type { SessionTicker } from '@/types/session';
import type { Booking } from '@/types/booking';

export const sessionApi = {
  async start(bookingId: string): Promise<Booking> {
    const { data } = await api.post<{ booking: Booking }>(`/bookings/${bookingId}/session/start`);
    return data.booking;
  },
  async onTheWay(bookingId: string): Promise<Booking> {
    const { data } = await api.post<{ booking: Booking }>(`/bookings/${bookingId}/session/on-the-way`);
    return data.booking;
  },
  async getTicker(bookingId: string): Promise<SessionTicker> {
    const { data } = await api.get<{ ticker: SessionTicker }>(`/bookings/${bookingId}/session/ticker`);
    return data.ticker;
  },
  async complete(bookingId: string): Promise<Booking> {
    const { data } = await api.post<{ booking: Booking }>(`/bookings/${bookingId}/session/complete`);
    return data.booking;
  },
};
