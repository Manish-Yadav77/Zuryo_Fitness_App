import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Ensure all ticker routes require authentication (returns 401 if unauthorized)
router.use(requireAuth);

export default router;