import { Schema, model } from 'mongoose';

export interface PeakWindow {
  weekdays: number[];
  startMinute: number;
  endMinute: number;
}

export interface IPricingConfig {
  _id: string;
  normalPaise: number;
  peakPaise: number;
  commissionPercent: number;
  timezone: string;
  peakWindows: PeakWindow[];
  version: number;
}

const peakWindowSchema = new Schema<PeakWindow>(
  {
    weekdays: [{ type: Number }],
    startMinute: { type: Number, required: true },
    endMinute: { type: Number, required: true },
  },
  { _id: false },
);

const pricingConfigSchema = new Schema<IPricingConfig>(
  {
    _id: { type: String, default: 'default' },
    normalPaise: { type: Number, required: true, default: 39900 },
    peakPaise: { type: Number, required: true, default: 49900 },
    commissionPercent: { type: Number, required: true, default: 10 },
    timezone: { type: String, required: true, default: 'Asia/Kolkata' },
    peakWindows: [peakWindowSchema],
    version: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

export const PricingConfig = model<IPricingConfig>('PricingConfig', pricingConfigSchema);