import { Schema, model } from 'mongoose';

export interface PeakWindow {
  weekdays: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  start: string; // "HH:mm" in IST
  end: string; // "HH:mm" in IST
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
    weekdays: [{ type: Number, required: true }],
    start: { type: String, required: true },
    end: { type: String, required: true },
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