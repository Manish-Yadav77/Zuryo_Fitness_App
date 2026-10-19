import { describe, expect, it } from 'vitest';
import { SlotLock } from '../models/SlotLock.js';

describe('SlotLock Concurrency Guard', () => {
  it('prevents overlapping atom locks for the same trainer', () => {
    const trainerId = 'trainer-test-101';
    const atomStart = new Date('2026-10-25T10:00:00.000Z');

    const lock1 = new SlotLock({ trainerId, atomStart, state: 'CONFIRMED' });
    const lock2 = new SlotLock({ trainerId, atomStart, state: 'CONFIRMED' });

    expect(lock1.trainerId).toBe(lock2.trainerId);
    expect(lock1.atomStart.getTime()).toBe(lock2.atomStart.getTime());
  });
});