import { Router } from 'express';
import { deleteTimeOff, getMyProfile, postTimeOff, setAvailability } from '../controllers/trainer.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, requireRole('trainer'), getMyProfile);
router.put('/availability', requireAuth, requireRole('trainer'), setAvailability);
router.post('/time-off', requireAuth, requireRole('trainer'), postTimeOff);
router.delete('/time-off/:id', requireAuth, requireRole('trainer'), deleteTimeOff);

export default router;