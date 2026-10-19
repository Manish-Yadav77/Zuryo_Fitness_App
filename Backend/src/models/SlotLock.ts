import { Schema, model, Types } from 'mongoose';

export interface ISlotLock {
  trainerId: string;
  atomStart: Date;
  bookingId?: Types.ObjectId | string;
  state: 'HELD' | 'CONFIRMED';
  holdExpiresAt?: Date;
}

const slotLockSchema = new Schema<ISlotLock>(
  {
    trainerId: { type: String, required: true },
    atomStart: { type: Date, required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    state: { type: String, enum: ['HELD', 'CONFIRMED'], default: 'HELD' },
    holdExpiresAt: { type: Date },
  },
  { timestamps: true },
);

slotLockSchema.index({ trainerId: 1, atomStart: 1 }, { unique: true });

export const SlotLock = model<ISlotLock>('SlotLock', slotLockSchema);