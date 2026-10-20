import { Router } from 'express';
import { getMyPackages, getTemplates } from '../controllers/package.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/templates', getTemplates);
router.get('/mine', requireAuth, requireRole('customer'), getMyPackages);
// Packages are created only by POST /payments/verify after a verified payment.

export default router;