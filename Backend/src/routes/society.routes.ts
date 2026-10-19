import { Router } from 'express';
import { getSocieties } from '../controllers/society.controller.js';

const router = Router();

router.get('/', getSocieties);

export default router;