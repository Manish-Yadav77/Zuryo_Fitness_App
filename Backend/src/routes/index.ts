import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);

export default router;