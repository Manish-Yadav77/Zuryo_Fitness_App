import type { PeakWindow } from '../models/PricingConfig.js';

/** Checks if a slot starting at `date` falls inside any peak window in IST time. */
export function isPeakSlot(date: Date, peakWindows: PeakWindow[]): boolean {
  // Convert UTC date to Asia/Kolkata time parts
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let weekdayStr = '';
  let hour = 0;
  let minute = 0;

  for (const part of parts) {
    if (part.type === 'weekday') weekdayStr = part.value;
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
  }

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const currentWeekday = dayMap[weekdayStr] ?? 0;
  const currentMinutes = hour * 60 + minute;

  for (const window of peakWindows) {
    if (!window.weekdays.includes(currentWeekday)) continue;

    const [startH, startM] = window.start.split(':').map((v) => parseInt(v, 10));
    const [endH, endM] = window.end.split(':').map((v) => parseInt(v, 10));

    const windowStartMinutes = (startH ?? 0) * 60 + (startM ?? 0);
    const windowEndMinutes = (endH ?? 0) * 60 + (endM ?? 0);

    if (currentMinutes >= windowStartMinutes && currentMinutes < windowEndMinutes) {
      return true;
    }
  }

  return false;
}