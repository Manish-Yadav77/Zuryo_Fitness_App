import { Router } from 'express';
import { getConfig, getQuote, putConfig } from '../controllers/pricing.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/config', getConfig);
router.get('/quote', getQuote);
router.put('/config', requireAuth, requireRole('admin'), putConfig);

export default router;