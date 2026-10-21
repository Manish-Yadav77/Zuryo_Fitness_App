import type { Society } from './society';

export type BookingMode = 'INSTANT' | 'SCHEDULED';
export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface PriceSnapshot {
  tier: 'NORMAL' | 'PEAK';
  sessionPaise: number;
  commissionPaise: number;
  totalPaise: number;
  commissionPercent: number;
  configVersion: number;
}

export interface CustomerDetails {
  name?: string;
  flatNumber?: string;
  phone?: string;
}

export interface SessionRecordSnapshot {
  durationMinutes?: number;
  exercises?: { name: string; sets: number; reps?: number; weightKg?: number }[];
  trainerNotes?: string;
  suggestedNextWorkout?: string;
  customerRating?: number;
  customerFeedback?: string;
}

export interface Booking {
  _id: string;
  customerId: string;
  trainerId: string;
  societyId: Society;
  mode: BookingMode;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  paymentMode: 'PAYMENT' | 'PACKAGE';
  priceSnapshot: PriceSnapshot;
  preferredTrainerId?: string;
  packageId?: string;
  holdExpiresAt?: string;
  rescheduleCount?: number;
  preferredHonored?: boolean;
  createdAt: string;
  customerDetails?: CustomerDetails;
  sessionRecord?: SessionRecordSnapshot | null;
}

export interface CreateBookingPayload {
  societyId: string;
  mode: BookingMode;
  startAt: string;
  preferredTrainerId?: string;
  paymentMode: 'PAYMENT' | 'PACKAGE';
  packageId?: string;
}