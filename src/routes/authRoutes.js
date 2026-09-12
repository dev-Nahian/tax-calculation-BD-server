import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { registerValidationRules, loginValidationRules } from '../validators/authValidator.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerValidationRules, validateRequest, register);
router.post('/login', authLimiter, loginValidationRules, validateRequest, login);
router.get('/me', protect, getMe);

export default router;
