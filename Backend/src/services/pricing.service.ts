import { PricingConfig } from '../models/PricingConfig.js';
import type { PeakWindow } from '../models/PricingConfig.js';
import { isPeakSlot } from './peak.js';

// Weekdays 06:00-09:00 and 17:00-21:00, weekends 07:00-11:00 (India time). Minutes since midnight.
export const DEFAULT_PEAK_WINDOWS: PeakWindow[] = [
  { weekdays: [1, 2, 3, 4, 5], startMinute: 360, endMinute: 540 },
  { weekdays: [1, 2, 3, 4, 5], startMinute: 1020, endMinute: 1260 },
  { weekdays: [0, 6], startMinute: 420, endMinute: 660 },
];

export interface PricingRules {
  normalPaise: number;
  peakPaise: number;
  commissionPercent: number;
  peakWindows: PeakWindow[];
  version: number;
}

export interface Quote {
  tier: 'NORMAL' | 'PEAK';
  sessionPaise: number;
  commissionPaise: number;
  totalPaise: number;
  commissionPercent: number;
  configVersion: number;
}

/** Pure function (no database). Money is integer paise; commission uses basis points to avoid float errors. */
export function buildQuote(rules: PricingRules, slotStart: Date): Quote {
  const peak = isPeakSlot(slotStart, rules.peakWindows);
  const sessionPaise = peak ? rules.peakPaise : rules.normalPaise;
  const basisPoints = Math.round(rules.commissionPercent * 100);
  const commissionPaise = Math.round((sessionPaise * basisPoints) / 10000);
  return {
    tier: peak ? 'PEAK' : 'NORMAL',
    sessionPaise,
    commissionPaise,
    totalPaise: sessionPaise + commissionPaise,
    commissionPercent: rules.commissionPercent,
    configVersion: rules.version,
  };
}

export async function getPricingConfig() {
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

export async function updatePricingConfig(data: {
  normalPaise: number;
  peakPaise: number;
  commissionPercent: number;
}) {
  const current = await getPricingConfig();
  current.normalPaise = data.normalPaise;
  current.peakPaise = data.peakPaise;
  current.commissionPercent = data.commissionPercent;
  current.version += 1;
  await current.save();
  return current;
}

export async function calculateQuoteForDate(slotStart: Date): Promise<Quote> {
  const config = await getPricingConfig();
  return buildQuote(
    {
      normalPaise: config.normalPaise,
      peakPaise: config.peakPaise,
      commissionPercent: config.commissionPercent,
      peakWindows: config.peakWindows.map((w) => ({
        weekdays: [...w.weekdays],
        startMinute: w.startMinute,
        endMinute: w.endMinute,
      })),
      version: config.version,
    },
    slotStart,
  );
}