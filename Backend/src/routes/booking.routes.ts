import { Router } from 'express';
import { getBookingById, getMyBookings, postBooking } from '../controllers/booking.controller.js';
import { postCancelBooking, postRescheduleBooking } from '../controllers/cancellation.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('customer'), postBooking);
router.get('/', requireAuth, requireRole('customer'), getMyBookings);
router.get('/:id', requireAuth, getBookingById);
router.post('/:id/cancel', requireAuth, postCancelBooking);
router.post('/:id/reschedule', requireAuth, requireRole('customer'), postRescheduleBooking);

export default router;