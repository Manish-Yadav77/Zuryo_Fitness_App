import { describe, expect, it } from 'vitest';
import { rankCandidates } from '../services/assignment.service.js';
import type { EvaluatedCandidate } from '../services/assignment.service.js';

describe('Trainer Candidate Ranking Engine', () => {
  const candidates: EvaluatedCandidate[] = [
    { trainerId: 't1', trainerName: 'Far Trainer', distanceKm: 5.2, sessionsToday: 0, rating: 4.9, eligible: true },
    { trainerId: 't2', trainerName: 'Close Trainer', distanceKm: 1.1, sessionsToday: 2, rating: 4.8, eligible: true },
    { trainerId: 't3', trainerName: 'Busy Trainer', distanceKm: 1.1, sessionsToday: 5, rating: 5.0, eligible: true },
    { trainerId: 't4', trainerName: 'Ineligible', distanceKm: 0.5, sessionsToday: 0, rating: 5.0, eligible: false, reason: 'Outside hours' },
  ];

  it('selects closest eligible trainer first', () => {
    const res = rankCandidates(candidates);
    expect(res.chosenId).toBe('t2');
    expect(res.preferredHonored).toBe(false);
  });

  it('honors preferred trainer if eligible', () => {
    const res = rankCandidates(candidates, 't1');
    expect(res.chosenId).toBe('t1');
    expect(res.preferredHonored).toBe(true);
  });

  it('falls back to ranking if preferred trainer is ineligible', () => {
    const res = rankCandidates(candidates, 't4');
    expect(res.chosenId).toBe('t2');
    expect(res.preferredHonored).toBe(false);
  });

  it('returns no trainer if all candidates are ineligible', () => {
    const ineligibles = candidates.map((c) => ({ ...c, eligible: false }));
    const res = rankCandidates(ineligibles);
    expect(res.chosenId).toBeUndefined();
  });
});