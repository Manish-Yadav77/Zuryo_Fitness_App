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
import availabilityRoutes from './availability.routes.js';
import recordRoutes from './record.routes.js';
import tickerRoutes from './ticker.routes.js';
import notificationRoutes from './notification.routes.js';

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
router.use('/availability', availabilityRoutes);
router.use('/records', recordRoutes);
router.use('/ticker', tickerRoutes);
router.use('/notifications', notificationRoutes);

export default router;
