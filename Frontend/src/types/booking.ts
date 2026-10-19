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
  preferredHonored?: boolean;
  createdAt: string;
}

export interface CreateBookingPayload {
  societyId: string;
  mode: BookingMode;
  startAt: string;
  preferredTrainerId?: string;
}