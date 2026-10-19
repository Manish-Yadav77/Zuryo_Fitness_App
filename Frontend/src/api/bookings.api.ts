import { api } from './client';
import type { Booking, CreateBookingPayload } from '@/types/booking';

export const bookingsApi = {
  async create(payload: CreateBookingPayload, idempotencyKey?: string): Promise<Booking> {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
    const { data } = await api.post<{ booking: Booking }>('/bookings', payload, { headers });
    return data.booking;
  },
  async getMine(): Promise<Booking[]> {
    const { data } = await api.get<{ bookings: Booking[] }>('/bookings');
    return data.bookings;
  },
  async getById(id: string): Promise<Booking> {
    const { data } = await api.get<{ booking: Booking }>(`/bookings/${id}`);
    return data.booking;
  },
  async cancel(id: string, reason?: string): Promise<Booking> {
    const { data } = await api.post<{ booking: Booking }>(`/bookings/${id}/cancel`, { reason });
    return data.booking;
  },
  async reschedule(id: string, newStartAt: string): Promise<Booking> {
    const { data } = await api.post<{ booking: Booking }>(`/bookings/${id}/reschedule`, { newStartAt });
    return data.booking;
  },
};