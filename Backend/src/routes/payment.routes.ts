import { Router } from 'express';
import { postCreateOrder, postVerifyPayment } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/order', requireAuth, postCreateOrder);
router.post('/verify', requireAuth, postVerifyPayment);

export default router;