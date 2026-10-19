import { Schema, model, Types } from 'mongoose';

export interface ICustomerProfile {
  userId: string;
  societyId: Types.ObjectId | string;
  flatNumber?: string;
  phone?: string;
}

const customerProfileSchema = new Schema<ICustomerProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    flatNumber: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true },
);

export const CustomerProfile = model<ICustomerProfile>('CustomerProfile', customerProfileSchema);