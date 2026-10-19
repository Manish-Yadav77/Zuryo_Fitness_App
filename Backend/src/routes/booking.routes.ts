import { Router } from 'express';
import {
  getAllBookingsAdmin,
  getAssignmentDecisionsAdmin,
  getAssignedBookings,
  getBookingById,
  getMyBookings,
  postBooking,
} from '../controllers/booking.controller.js';
import { postCancelBooking, postRescheduleBooking } from '../controllers/cancellation.controller.js';
import { getTicker, postCompleteSession, postStartSession } from '../controllers/session.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('customer'), postBooking);
router.get('/', requireAuth, requireRole('customer'), getMyBookings);
router.get('/assigned', requireAuth, requireRole('trainer'), getAssignedBookings);
router.get('/admin/all', requireAuth, requireRole('admin'), getAllBookingsAdmin);
router.get('/admin/assignments', requireAuth, requireRole('admin'), getAssignmentDecisionsAdmin);

router.get('/:id', requireAuth, getBookingById);
router.post('/:id/cancel', requireAuth, postCancelBooking);
router.post('/:id/reschedule', requireAuth, requireRole('customer'), postRescheduleBooking);

// Live session timer routes
router.post('/:id/session/start', requireAuth, requireRole('trainer'), postStartSession);
router.get('/:id/session/ticker', requireAuth, getTicker);
router.post('/:id/session/complete', requireAuth, requireRole('trainer'), postCompleteSession);

export default router;