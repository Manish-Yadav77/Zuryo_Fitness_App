import { Schema, model, Types } from 'mongoose';

export interface IPackageLedger {
  packageId: Types.ObjectId | string;
  bookingId: Types.ObjectId | string;
  type: 'CONSUME' | 'RESTORE';
  sessionsCount: number;
}

const packageLedgerSchema = new Schema<IPackageLedger>(
  {
    packageId: { type: Schema.Types.ObjectId, ref: 'CustomerPackage', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    type: { type: String, enum: ['CONSUME', 'RESTORE'], required: true },
    sessionsCount: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

// Unique index ensures a booking cannot deduct from a package twice
packageLedgerSchema.index({ bookingId: 1, type: 1 }, { unique: true });

export const PackageLedger = model<IPackageLedger>('PackageLedger', packageLedgerSchema);