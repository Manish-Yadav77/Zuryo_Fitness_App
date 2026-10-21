import { Router } from 'express';
import { getMyNotifications, patchMarkRead, postMarkAllRead } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', getMyNotifications);
router.patch('/:id/read', patchMarkRead);
router.post('/read-all', postMarkAllRead);
export default router;
