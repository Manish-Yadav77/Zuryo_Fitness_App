export type PricingTier = 'NORMAL' | 'PEAK';

export interface PeakWindow {
  weekdays: number[];
  start: string;
  end: string;
}

export interface PricingConfig {
  _id: string;
  normalPaise: number;
  peakPaise: number;
  commissionPercent: number;
  timezone: string;
  peakWindows: PeakWindow[];
  version: number;
}

export interface PriceQuote {
  tier: PricingTier;
  sessionPaise: number;
  commissionPaise: number;
  totalPaise: number;
  commissionPercent: number;
  configVersion: number;
  startAt: string;
}