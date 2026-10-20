import { describe, expect, it } from 'vitest';
import { assertCanViewBooking, canViewBooking } from '../utils/ownership.js';
import { AppError } from '../utils/AppError.js';

const booking = { customerId: 'cust-1', trainerId: 'train-1' };

describe('booking ownership rules', () => {
  it('lets the owning customer, the assigned trainer and an admin view it', () => {
    expect(canViewBooking(booking, { id: 'cust-1', role: 'customer' })).toBe(true);
    expect(canViewBooking(booking, { id: 'train-1', role: 'trainer' })).toBe(true);
    expect(canViewBooking(booking, { id: 'anyone', role: 'admin' })).toBe(true);
  });
  it('blocks other customers and other trainers', () => {
    expect(canViewBooking(booking, { id: 'cust-2', role: 'customer' })).toBe(false);
    expect(canViewBooking(booking, { id: 'train-2', role: 'trainer' })).toBe(false);
  });
  it('does not mix up roles that share an id', () => {
    expect(canViewBooking(booking, { id: 'train-1', role: 'customer' })).toBe(false);
    expect(canViewBooking(booking, { id: 'cust-1', role: 'trainer' })).toBe(false);
  });
  it('throws a 404 (not 403) so booking existence is not revealed', () => {
    try {
      assertCanViewBooking(booking, { id: 'cust-2', role: 'customer' });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(404);
    }
  });
});