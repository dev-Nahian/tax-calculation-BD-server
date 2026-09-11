import { body } from 'express-validator';

export const taxEstimateValidationRules = [
  body('assessmentYear').optional().isString().withMessage('Assessment year must be a string'),
  body('category').optional().isIn(['general', 'female', 'senior', 'disabled', 'gazetted_freedom_fighter', 'parent_of_disabled']).withMessage('Invalid tax category'),
  body('zone').optional().isIn(['dhaka_chattogram', 'other_city_corporation', 'non_city_corporation']).withMessage('Invalid tax location zone'),
  body('inputs').optional().isObject().withMessage('Inputs must be an object'),
];
