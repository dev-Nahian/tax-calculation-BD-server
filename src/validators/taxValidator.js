import { body } from 'express-validator';

export const taxEstimateValidationRules = [
  body('assessmentYear')
    .optional()
    .isString()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage("Assessment year must be in format 'YYYY-YYYY' (e.g., '2024-2025')"),

  body(['category', 'taxpayerProfile.category'])
    .optional()
    .isIn([
      'general',
      'female',
      'seniorCitizen',
      'senior',
      'thirdGender',
      'disabled',
      'freedomFighter',
      'gazetted_freedom_fighter',
      'parentOfDisabled',
      'parent_of_disabled',
    ])
    .withMessage('Invalid taxpayer category'),

  body(['zone', 'taxpayerProfile.zone'])
    .optional()
    .isIn(['dhaka_chattogram', 'other_city_corporation', 'non_city_corporation'])
    .withMessage('Invalid residential tax zone'),

  body(['taxpayerProfile.age', 'age'])
    .optional()
    .isFloat({ min: 0, max: 130 })
    .withMessage('Age must be between 0 and 130'),

  body(['taxpayerProfile.disabledChildrenCount', 'disabledChildrenCount'])
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Disabled children count must be a positive integer up to 20'),

  // Non-negative numerical validations for primary income fields
  body([
    'salaryIncome',
    'houseRentAllowance',
    'medicalAllowance',
    'conveyanceAllowance',
    'festivalBonus',
    'otherAllowances',
    'housePropertyIncome',
    'agricultureIncome',
    'businessIncome',
    'capitalGains',
    'financialAssets',
    'otherIncome',
    'income.salary.basicSalary',
    'income.salary.houseRentAllowance',
    'income.salary.medicalAllowance',
    'income.salary.conveyanceAllowance',
    'income.salary.festivalBonus',
    'income.salary.otherAllowances',
    'income.houseProperty',
    'income.agriculture',
    'income.business',
    'income.capitalGain',
    'income.financialAssets',
    'income.otherSources',
  ])
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Income figures must be non-negative numbers'),

  // Non-negative investment & rebate fields
  body([
    'investments.dps',
    'investments.sanchayapatra',
    'investments.lifeInsurance',
    'investments.stockMarket',
    'investments.providentFund',
    'investments.otherEligible',
    'rebates.dps',
    'rebates.sanchayapatra',
    'rebates.lifeInsurance',
    'rebates.stockMarket',
    'rebates.providentFund',
    'rebates.otherEligible',
  ])
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Investment figures must be non-negative numbers'),

  body(['otherInformation.netWealth', 'netWealth'])
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Net wealth must be a non-negative number'),

  body('saveRecord')
    .optional()
    .isBoolean()
    .withMessage('saveRecord must be a boolean flag'),
];
