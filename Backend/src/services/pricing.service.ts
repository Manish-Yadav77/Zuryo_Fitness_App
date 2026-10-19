import { PricingConfig } from '../models/PricingConfig.js';
import { isPeakSlot } from './peak.js';
import { AppError } from '../utils/AppError.js';

export type PricingTier = 'NORMAL' | 'PEAK';

export interface PriceQuote {
  tier: PricingTier;
  sessionPaise: number;
  commissionPaise: number;
  totalPaise: number;
  commissionPercent: number;
  configVersion: number;
  startAt: string;
}

export const DEFAULT_PEAK_WINDOWS = [
  { weekdays: [1, 2, 3, 4, 5], start: '06:00', end: '09:00' }, // Mon-Fri morning
  { weekdays: [1, 2, 3, 4, 5], start: '17:00', end: '21:00' }, // Mon-Fri evening
  { weekdays: [0, 6], start: '07:00', end: '11:00' }, // Weekend morning
];

export async function getActivePricingConfig() {
  let config = await PricingConfig.findById('default');
  if (!config) {
    config = await PricingConfig.create({
      _id: 'default',
      normalPaise: 39900,
      peakPaise: 49900,
      commissionPercent: 10,
      timezone: 'Asia/Kolkata',
      peakWindows: DEFAULT_PEAK_WINDOWS,
      version: 1,
    });
  }
  return config;
}

export async function calculateQuoteForDate(startAt: Date): Promise<PriceQuote> {
  if (isNaN(startAt.getTime())) {
    throw new AppError(400, 'INVALID_DATE', 'Please provide a valid ISO start time');
  }

  const config = await getActivePricingConfig();
  const isPeak = isPeakSlot(startAt, config.peakWindows);

  const tier: PricingTier = isPeak ? 'PEAK' : 'NORMAL';
  const sessionPaise = isPeak ? config.peakPaise : config.normalPaise;
  const commissionPaise = Math.round((sessionPaise * config.commissionPercent) / 100);
  const totalPaise = sessionPaise + commissionPaise;

  return {
    tier,
    sessionPaise,
    commissionPaise,
    totalPaise,
    commissionPercent: config.commissionPercent,
    configVersion: config.version,
    startAt: startAt.toISOString(),
  };
}