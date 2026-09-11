import express from 'express';
import { calculateTaxEstimate, getUserTaxHistory } from '../controllers/taxController.js';
import { taxEstimateValidationRules } from '../validators/taxValidator.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/estimate', taxEstimateValidationRules, validateRequest, calculateTaxEstimate);
router.get('/history', protect, getUserTaxHistory);

export default router;
