export interface PeakWindow {
  weekdays: number[];
  startMinute: number;
  endMinute: number;
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
  tier: 'NORMAL' | 'PEAK';
  sessionPaise: number;
  commissionPaise: number;
  totalPaise: number;
  commissionPercent: number;
  configVersion: number;
}