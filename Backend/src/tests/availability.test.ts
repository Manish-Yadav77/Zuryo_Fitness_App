import { describe, expect, it } from 'vitest';
import { rankCandidates } from '../services/assignment.service.js';
import type { EvaluatedCandidate } from '../services/assignment.service.js';

describe('Candidate Ranking and Tie-Breaking Logic', () => {
  it('ranks closer candidates first', () => {
    const candidates: EvaluatedCandidate[] = [
      { trainerId: 't2', trainerName: 'Far Trainer', distanceKm: 5.2, sessionsToday: 0, rating: 5.0, eligible: true },
      { trainerId: 't1', trainerName: 'Near Trainer', distanceKm: 1.1, sessionsToday: 0, rating: 4.8, eligible: true },
    ];

    const result = rankCandidates(candidates);
    expect(result.chosenTrainerId).toBe('t1');
  });

  it('ranks candidates with fewer sessions today if distance is equal', () => {
    const candidates: EvaluatedCandidate[] = [
      { trainerId: 't2', trainerName: 'Busy Trainer', distanceKm: 2.0, sessionsToday: 3, rating: 5.0, eligible: true },
      { trainerId: 't1', trainerName: 'Free Trainer', distanceKm: 2.0, sessionsToday: 0, rating: 4.8, eligible: true },
    ];

    const result = rankCandidates(candidates);
    expect(result.chosenTrainerId).toBe('t1');
  });

  it('honors preferred trainer when eligible', () => {
    const candidates: EvaluatedCandidate[] = [
      { trainerId: 't1', trainerName: 'Closer Trainer', distanceKm: 1.0, sessionsToday: 0, rating: 4.9, eligible: true },
      { trainerId: 't2', trainerName: 'Preferred Trainer', distanceKm: 3.5, sessionsToday: 1, rating: 4.8, eligible: true },
    ];

    const result = rankCandidates(candidates, 't2');
    expect(result.chosenTrainerId).toBe('t2');
    expect(result.preferredHonored).toBe(true);
  });

  it('ignores preferred trainer if they are ineligible', () => {
    const candidates: EvaluatedCandidate[] = [
      { trainerId: 't1', trainerName: 'Closer Trainer', distanceKm: 1.0, sessionsToday: 0, rating: 4.9, eligible: true },
      { trainerId: 't2', trainerName: 'Preferred Busy', distanceKm: 0.5, sessionsToday: 2, rating: 5.0, eligible: false, reason: 'Outside working hours' },
    ];

    const result = rankCandidates(candidates, 't2');
    expect(result.chosenTrainerId).toBe('t1');
    expect(result.preferredHonored).toBe(false);
  });
});