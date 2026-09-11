import express from 'express';
import { calculateTaxEstimate, getUserTaxHistory } from '../controllers/taxController.js';
import { taxEstimateValidationRules } from '../validators/taxValidator.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/estimate', calculateTaxEstimate);
router.post('/calculate', calculateTaxEstimate);
router.get('/history', protect, getUserTaxHistory);

export default router;
