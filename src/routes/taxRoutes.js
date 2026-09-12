import express from 'express';
import {
  calculateTaxEstimate,
  getUserTaxHistory,
  deleteTaxHistoryRecord,
  clearAllTaxHistory,
  getPrivacyPolicy,
} from '../controllers/taxController.js';
import { taxEstimateValidationRules } from '../validators/taxValidator.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { taxCalculationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public calculation endpoints (Rate-limited, Input-validated, Anonymous allowed)
router.post('/estimate', taxCalculationLimiter, taxEstimateValidationRules, validateRequest, calculateTaxEstimate);
router.post('/calculate', taxCalculationLimiter, taxEstimateValidationRules, validateRequest, calculateTaxEstimate);

// Privacy & Transparency endpoint
router.get('/privacy', getPrivacyPolicy);

// User calculation history management (Protected)
router.get('/history', protect, getUserTaxHistory);
router.delete('/history/:id', protect, deleteTaxHistoryRecord);
router.delete('/history', protect, clearAllTaxHistory);

export default router;
