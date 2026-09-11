import express from 'express';
import authRoutes from './authRoutes.js';
import ruleRoutes from './ruleRoutes.js';
import taxRoutes from './taxRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rules', ruleRoutes);
router.use('/tax', taxRoutes);

export default router;
