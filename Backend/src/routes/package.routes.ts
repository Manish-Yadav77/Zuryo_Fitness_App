import { Router } from 'express';
import { getMyPackages, getTemplates, postPurchasePackage } from '../controllers/package.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/templates', getTemplates);
router.get('/mine', requireAuth, requireRole('customer'), getMyPackages);
router.post('/purchase', requireAuth, requireRole('customer'), postPurchasePackage);

export default router;