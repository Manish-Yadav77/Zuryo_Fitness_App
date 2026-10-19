import { Router } from 'express';
import { getMyAssessment, submitAssessment } from '../controllers/assessment.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, requireRole('customer'), getMyAssessment);
router.post('/', requireAuth, requireRole('customer'), submitAssessment);

export default router;