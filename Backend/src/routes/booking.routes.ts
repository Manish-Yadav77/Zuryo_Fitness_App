import { Router } from 'express';
import { getBookingById, getMyBookings, postBooking } from '../controllers/booking.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('customer'), postBooking);
router.get('/', requireAuth, requireRole('customer'), getMyBookings);
router.get('/:id', requireAuth, getBookingById);

export default router;