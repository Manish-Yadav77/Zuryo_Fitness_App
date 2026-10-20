import { describe, expect, it } from 'vitest';
import { isPeakSlot } from '../services/peak.js';
import { DEFAULT_PEAK_WINDOWS, buildQuote } from '../services/pricing.service.js';
import type { PricingRules } from '../services/pricing.service.js';

const rules: PricingRules = {
  normalPaise: 39900,
  peakPaise: 49900,
  commissionPercent: 10,
  peakWindows: DEFAULT_PEAK_WINDOWS,
  version: 1,
};

// 2026-10-19 is a Monday, 24 is Saturday, 25 is Sunday. All times below are India time (+05:30).
describe('peak detection (default windows)', () => {
  it('Monday 07:00 is peak', () => {
    expect(isPeakSlot(new Date('2026-10-19T07:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(true);
  });
  it('Monday 06:00 is peak (start is inclusive)', () => {
    expect(isPeakSlot(new Date('2026-10-19T06:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(true);
  });
  it('Monday 09:00 is normal (end is exclusive)', () => {
    expect(isPeakSlot(new Date('2026-10-19T09:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(false);
  });
  it('Monday 14:00 is normal', () => {
    expect(isPeakSlot(new Date('2026-10-19T14:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(false);
  });
  it('Monday 17:00 and 20:45 are peak, 21:00 is normal', () => {
    expect(isPeakSlot(new Date('2026-10-19T17:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(true);
    expect(isPeakSlot(new Date('2026-10-19T20:45:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(true);
    expect(isPeakSlot(new Date('2026-10-19T21:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(false);
  });
  it('Saturday 08:00 and Sunday 08:00 are peak, Saturday 12:00 is normal', () => {
    expect(isPeakSlot(new Date('2026-10-24T08:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(true);
    expect(isPeakSlot(new Date('2026-10-25T08:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(true);
    expect(isPeakSlot(new Date('2026-10-24T12:00:00+05:30'), DEFAULT_PEAK_WINDOWS)).toBe(false);
  });
  it('uses India time, not UTC (01:30 UTC is 07:00 IST)', () => {
    expect(isPeakSlot(new Date('2026-10-19T01:30:00.000Z'), DEFAULT_PEAK_WINDOWS)).toBe(true);
  });
});

describe('price calculation (integer paise)', () => {
  it('normal slot: ₹399 + ₹39.90 = ₹438.90', () => {
    const q = buildQuote(rules, new Date('2026-10-19T14:00:00+05:30'));
    expect(q.tier).toBe('NORMAL');
    expect(q.sessionPaise).toBe(39900);
    expect(q.commissionPaise).toBe(3990);
    expect(q.totalPaise).toBe(43890);
  });
  it('peak slot: ₹499 + ₹49.90 = ₹548.90', () => {
    const q = buildQuote(rules, new Date('2026-10-19T07:00:00+05:30'));
    expect(q.tier).toBe('PEAK');
    expect(q.sessionPaise).toBe(49900);
    expect(q.commissionPaise).toBe(4990);
    expect(q.totalPaise).toBe(54890);
  });
  it('is configurable: 12.5% commission rounds to the nearest paise', () => {
    const q = buildQuote({ ...rules, commissionPercent: 12.5 }, new Date('2026-10-19T14:00:00+05:30'));
    expect(q.commissionPaise).toBe(4988);
    expect(q.totalPaise).toBe(44888);
  });
  it('0% commission adds nothing and the version is carried into the quote', () => {
    const q = buildQuote({ ...rules, commissionPercent: 0, version: 7 }, new Date('2026-10-19T14:00:00+05:30'));
    expect(q.commissionPaise).toBe(0);
    expect(q.configVersion).toBe(7);
  });
});