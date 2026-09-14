import express from 'express';
import authRoutes from './authRoutes.js';
import ruleRoutes from './ruleRoutes.js';
import taxRoutes from './taxRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = express.Router();

import {
  getYears,
  getRuleByYear,
  getSourcesByYear,
  getSources,
} from '../controllers/ruleController.js';
import adminRoutes from './adminRoutes.js';

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rules', ruleRoutes);
router.use('/tax', taxRoutes);
router.use('/admin', adminRoutes);

// Convenience aliases
router.get('/tax-years', getYears);
router.get('/tax-years/:year', getRuleByYear);
router.get('/tax-rules/:year', getRuleByYear);
router.get('/tax-sources/:year', getSourcesByYear);
router.get('/tax-sources', getSources);

export default router;
