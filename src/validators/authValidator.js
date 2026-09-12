import { body } from 'express-validator';

export const registerValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),

  body('category')
    .optional()
    .isIn(['general', 'female', 'senior', 'disabled', 'gazetted_freedom_fighter', 'parent_of_disabled'])
    .withMessage('Invalid tax category'),

  body('zone')
    .optional()
    .isIn(['dhaka_chattogram', 'other_city_corporation', 'non_city_corporation'])
    .withMessage('Invalid tax location zone'),

  body('tinNumber')
    .optional()
    .trim()
    .matches(/^(\d{12})?$/)
    .withMessage('TIN Number must be a valid 12-digit numeric identifier'),
];

export const loginValidationRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
