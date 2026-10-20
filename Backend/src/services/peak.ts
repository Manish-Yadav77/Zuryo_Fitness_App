import type { PeakWindow } from '../models/PricingConfig.js';

const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const istParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

/** Weekday (0 = Sunday) and minutes since midnight of a moment, in India time. */
export function getIstWeekdayAndMinutes(date: Date): { weekday: number; minutes: number } {
  let weekdayStr = '';
  let hour = 0;
  let minute = 0;
  for (const part of istParts.formatToParts(date)) {
    if (part.type === 'weekday') weekdayStr = part.value;
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
  }
  return { weekday: DAY_INDEX[weekdayStr] ?? 0, minutes: hour * 60 + minute };
}

/** A slot is peak when its START time falls inside any peak window (start inclusive, end exclusive). */
export function isPeakSlot(slotStart: Date, peakWindows: PeakWindow[]): boolean {
  if (!peakWindows || peakWindows.length === 0) return false;
  const { weekday, minutes } = getIstWeekdayAndMinutes(slotStart);
  return peakWindows.some(
    (w) => w.weekdays.includes(weekday) && minutes >= w.startMinute && minutes < w.endMinute,
  );
}