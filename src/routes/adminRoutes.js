import express from 'express';
import {
  getAdminRules,
  updateStatus,
  verifyRules,
} from '../controllers/adminRuleController.js';

const router = express.Router();

router.get('/tax-rules', getAdminRules);
router.patch('/tax-rules/:year/status', updateStatus);
router.post('/tax-rules/:year/verify', verifyRules);

export default router;
