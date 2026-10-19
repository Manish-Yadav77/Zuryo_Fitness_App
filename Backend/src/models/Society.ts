import { Schema, model } from 'mongoose';

export interface ISociety {
  _id: string;
  name: string;
  zoneId: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  commissionPercent: number;
  isActive: boolean;
}

const societySchema = new Schema<ISociety>(
  {
    name: { type: String, required: true, trim: true },
    zoneId: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    commissionPercent: { type: Number, required: true, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Society = model<ISociety>('Society', societySchema);