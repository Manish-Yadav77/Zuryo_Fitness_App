import { Router } from 'express';
import {
  getAiRecommendation,
  getRecordByBooking,
  postCustomerFeedback,
  postSessionRecord,
} from '../controllers/record.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('trainer'), postSessionRecord);
router.get('/booking/:bookingId', requireAuth, getRecordByBooking);
router.post('/booking/:bookingId/feedback', requireAuth, requireRole('customer'), postCustomerFeedback);
router.get('/ai-recommendation', requireAuth, requireRole('customer'), getAiRecommendation);

export default router;