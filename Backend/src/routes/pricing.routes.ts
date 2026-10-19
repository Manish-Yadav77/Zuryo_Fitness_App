import { Router } from 'express';
import { getPricingConfig, getQuote } from '../controllers/pricing.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/config', requireAuth, getPricingConfig);
router.post('/quote', requireAuth, getQuote);

export default router;