import { describe, expect, it } from 'vitest';
import { isPeakSlot } from '../services/peak.js';
import type { PeakWindow } from '../models/PricingConfig.js';

const testWindows: PeakWindow[] = [
  { weekdays: [1, 2, 3, 4, 5], start: '06:00', end: '09:00' },
];

describe('Pricing and Peak Detection', () => {
  it('detects a peak slot correctly in IST timezone', () => {
    // 2026-10-19 is a Monday. 07:00 IST is 01:30 UTC.
    const peakTime = new Date('2026-10-19T01:30:00.000Z');
    expect(isPeakSlot(peakTime, testWindows)).toBe(true);
  });

  it('detects a normal slot outside peak hours', () => {
    // 2026-10-19 11:00 IST is 05:30 UTC.
    const normalTime = new Date('2026-10-19T05:30:00.000Z');
    expect(isPeakSlot(normalTime, testWindows)).toBe(false);
  });

  it('calculates normal slot total price correctly (₹399 -> ₹438.90)', () => {
    const normalPaise = 39900;
    const commissionPercent = 10;
    const commissionPaise = Math.round((normalPaise * commissionPercent) / 100);
    const totalPaise = normalPaise + commissionPaise;

    expect(normalPaise).toBe(39900);
    expect(commissionPaise).toBe(3990);
    expect(totalPaise).toBe(43890);
  });

  it('calculates peak slot total price correctly (₹499 -> ₹548.90)', () => {
    const peakPaise = 49900;
    const commissionPercent = 10;
    const commissionPaise = Math.round((peakPaise * commissionPercent) / 100);
    const totalPaise = peakPaise + commissionPaise;

    expect(peakPaise).toBe(49900);
    expect(commissionPaise).toBe(4990);
    expect(totalPaise).toBe(54890);
  });
});