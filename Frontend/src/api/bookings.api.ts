import { api } from './client';
import type { Booking, CreateBookingPayload } from '@/types/booking';

export interface AssignmentDecisionDoc {
  _id: string;
  bookingId?: string;
  requestedAt: string;
  slotStart: string;
  societyId: { _id: string; name: string };
  candidates: {
    trainerId: string;
    trainerName: string;
    distanceKm: number;
    sessionsToday: number;
    rating: number;
    eligible: boolean;
    reason?: string;
  }[];
  chosenTrainerId?: string;
  outcome: 'ASSIGNED' | 'NO_TRAINER';
  createdAt: string;
}

export interface AdminPaymentDoc {
  _id: string;
  purpose: 'BOOKING' | 'PACKAGE';
  bookingId?: string;
  packageTemplateId?: string;
  customerId: string;
  amountPaise: number;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface AdminBookingsResponse {
  bookings: Booking[];
  payments: AdminPaymentDoc[];
}

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
  async getAssigned(): Promise<Booking[]> {
    const { data } = await api.get<{ bookings: Booking[] }>('/bookings/assigned');
    return data.bookings;
  },
  async getAllAdmin(): Promise<AdminBookingsResponse> {
    const { data } = await api.get<{ bookings: Booking[]; payments?: AdminPaymentDoc[] }>('/bookings/admin/all');
    return {
      bookings: data.bookings || [],
      payments: data.payments || [],
    };
  },
  async getAssignmentsAdmin(): Promise<AssignmentDecisionDoc[]> {
    const { data } = await api.get<{ decisions: AssignmentDecisionDoc[] }>('/bookings/admin/assignments');
    return data.decisions;
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