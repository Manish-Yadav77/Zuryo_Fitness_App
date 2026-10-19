import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import pricingRoutes from './pricing.routes.js';
import societyRoutes from './society.routes.js';
import assessmentRoutes from './assessment.routes.js';
import trainerRoutes from './trainer.routes.js';
import bookingRoutes from './booking.routes.js';
import paymentRoutes from './payment.routes.js';
import packageRoutes from './package.routes.js';
import { getMyNotifications, patchMarkRead } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/pricing', pricingRoutes);
router.use('/societies', societyRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/trainer', trainerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/packages', packageRoutes);

router.get('/notifications', requireAuth, getMyNotifications);
router.patch('/notifications/:id/read', requireAuth, patchMarkRead);

export default router;