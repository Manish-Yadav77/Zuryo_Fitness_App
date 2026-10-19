import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import pricingRoutes from './pricing.routes.js';
import societyRoutes from './society.routes.js';
import assessmentRoutes from './assessment.routes.js';

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

export default router;