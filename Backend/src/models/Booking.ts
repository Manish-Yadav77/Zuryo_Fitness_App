import { Schema, model, Types } from 'mongoose';

export const BOOKING_MODES = ['INSTANT', 'SCHEDULED'] as const;
export type BookingMode = (typeof BOOKING_MODES)[number];

export const BOOKING_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface PriceSnapshot {
  tier: 'NORMAL' | 'PEAK';
  sessionPaise: number;
  commissionPaise: number;
  totalPaise: number;
  commissionPercent: number;
  configVersion: number;
}

export interface IBooking {
  customerId: string;
  trainerId: string;
  societyId: Types.ObjectId | string;
  mode: BookingMode;
  startAt: Date;
  endAt: Date;
  status: BookingStatus;
  paymentMode: 'PAYMENT' | 'PACKAGE';
  packageId?: string;
  priceSnapshot: PriceSnapshot;
  preferredTrainerId?: string;
  preferredHonored?: boolean;
  idempotencyKey?: string;
  holdExpiresAt?: Date;
  rescheduleCount: number;
  cancelledAt?: Date;
  cancelReason?: string;
  session?: {
    startedAt?: Date;
    warnAt?: Date;
    endsAt?: Date;
    warnFiredAt?: Date;
    completeFiredAt?: Date;
  };
}

const bookingSchema = new Schema<IBooking>(
  {
    customerId: { type: String, required: true, index: true },
    trainerId: { type: String, required: true, index: true },
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    mode: { type: String, enum: BOOKING_MODES, required: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'CONFIRMED' },
    paymentMode: { type: String, enum: ['PAYMENT', 'PACKAGE'], default: 'PAYMENT' },
    packageId: { type: String },
    priceSnapshot: {
      tier: { type: String, enum: ['NORMAL', 'PEAK'], required: true },
      sessionPaise: { type: Number, required: true },
      commissionPaise: { type: Number, required: true },
      totalPaise: { type: Number, required: true },
      commissionPercent: { type: Number, required: true },
      configVersion: { type: Number, required: true },
    },
    preferredTrainerId: { type: String },
    preferredHonored: { type: Boolean, default: false },
    idempotencyKey: { type: String, index: true },
    holdExpiresAt: { type: Date },
    rescheduleCount: { type: Number, default: 0 },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    session: {
      startedAt: { type: Date },
      warnAt: { type: Date },
      endsAt: { type: Date },
      warnFiredAt: { type: Date },
      completeFiredAt: { type: Date },
    },
  },
  { timestamps: true },
);

bookingSchema.index({ customerId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Booking = model<IBooking>('Booking', bookingSchema);