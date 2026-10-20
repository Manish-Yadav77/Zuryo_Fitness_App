import { Router } from 'express';
import { getAvailability, getEligibleTrainers, getInstantAvailability } from '../controllers/availability.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getAvailability);
router.get('/instant', requireAuth, getInstantAvailability);
router.get('/trainers', requireAuth, getEligibleTrainers);

export default router;