import { body } from 'express-validator';

export const registerValidationRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('category').optional().isIn(['general', 'female', 'senior', 'disabled', 'gazetted_freedom_fighter', 'parent_of_disabled']),
  body('zone').optional().isIn(['dhaka_chattogram', 'other_city_corporation', 'non_city_corporation']),
];

export const loginValidationRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
