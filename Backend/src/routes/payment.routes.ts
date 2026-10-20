import { Router } from 'express';
import { postCreateOrder, postVerifyPayment } from '../controllers/payment.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/order', requireAuth, requireRole('customer'), postCreateOrder);
router.post('/verify', requireAuth, requireRole('customer'), postVerifyPayment);

export default router;