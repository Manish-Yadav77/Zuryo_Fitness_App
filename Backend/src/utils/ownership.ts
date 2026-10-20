import type { AuthUser } from '../middleware/auth.js';
import { AppError } from './AppError.js';

export interface OwnedBooking {
  customerId: string;
  trainerId: string;
}

/** Customer: own bookings. Trainer: assigned bookings. Admin: all bookings. */
export function canViewBooking(booking: OwnedBooking, auth: AuthUser): boolean {
  if (auth.role === 'admin') return true;
  if (auth.role === 'customer') return booking.customerId === auth.id;
  if (auth.role === 'trainer') return booking.trainerId === auth.id;
  return false;
}

/** Throws 404 (not 403) so we do not reveal that another user's booking exists. */
export function assertCanViewBooking(booking: OwnedBooking, auth: AuthUser): void {
  if (!canViewBooking(booking, auth)) {
    throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  }
}