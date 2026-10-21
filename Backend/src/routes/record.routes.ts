import { Router } from 'express';
import {
  getAiRecommendation,
  getMyRecords,
  getRecordByBooking,
  postCustomerFeedback,
  postSessionRecord,
} from '../controllers/record.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireAuth, requireRole('trainer'), postSessionRecord);
router.get('/booking/:bookingId', requireAuth, getRecordByBooking);
router.get('/mine', requireAuth, requireRole('customer'), getMyRecords);
router.post('/booking/:bookingId/feedback', requireAuth, requireRole('customer'), postCustomerFeedback);
router.get('/ai-recommendation', requireAuth, requireRole('customer'), getAiRecommendation);

export default router;
