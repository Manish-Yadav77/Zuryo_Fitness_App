import { Router } from 'express';
import { getDaySlots, getEligibleTrainers, getInstantSlotOptions } from '../controllers/availability.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/slots', requireAuth, getDaySlots);
router.get('/instant', requireAuth, getInstantSlotOptions);
router.get('/trainers', requireAuth, getEligibleTrainers);

export default router;