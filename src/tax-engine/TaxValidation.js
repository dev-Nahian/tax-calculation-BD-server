/**
 * Input Validator for TaxBD Calculation Engine
 */

export const SUPPORTED_ASSESSMENT_YEARS = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];

export const VALID_CATEGORIES = [
  'general',
  'female',
  'seniorCitizen',
  'thirdGender',
  'disabled',
  'freedomFighter',
  'parentOfDisabled',
];

export const VALID_ZONES = [
  'dhaka_chattogram',
  'other_city_corporation',
  'non_city_corporation',
];

export class TaxValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'TaxValidationError';
    this.statusCode = 422;
    this.errors = errors;
  }
}

export const validateTaxCalculationPayload = (payload) => {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    throw new TaxValidationError('Calculation payload must be a non-null object.', [
      { field: 'payload', message: 'Payload is missing or invalid' },
    ]);
  }

  // 1. Assessment Year Validation
  const assessmentYear = payload.assessmentYear || '2024-2025';
  if (!SUPPORTED_ASSESSMENT_YEARS.includes(assessmentYear)) {
    errors.push({
      field: 'assessmentYear',
      message: `Assessment Year '${assessmentYear}' is not supported. Supported years: ${SUPPORTED_ASSESSMENT_YEARS.join(', ')}`,
    });
  }

  // 2. Taxpayer Profile Validation
  const profile = payload.taxpayerProfile || {};
  const category = profile.category || 'general';

  if (!VALID_CATEGORIES.includes(category)) {
    errors.push({
      field: 'taxpayerProfile.category',
      message: `Invalid taxpayer category '${category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  if (profile.age !== undefined && profile.age !== null) {
    const age = Number(profile.age);
    if (isNaN(age) || age < 0 || age > 130) {
      errors.push({
        field: 'taxpayerProfile.age',
        message: 'Age must be a valid number between 0 and 130.',
      });
    }
  }

  if (profile.zone && !VALID_ZONES.includes(profile.zone)) {
    errors.push({
      field: 'taxpayerProfile.zone',
      message: `Invalid residential zone '${profile.zone}'. Valid zones: ${VALID_ZONES.join(', ')}`,
    });
  }

  if (profile.disabledChildrenCount !== undefined && profile.disabledChildrenCount !== null) {
    const count = Number(profile.disabledChildrenCount);
    if (isNaN(count) || count < 0 || count > 20) {
      errors.push({
        field: 'taxpayerProfile.disabledChildrenCount',
        message: 'Disabled children count must be a non-negative number.',
      });
    }
  }

  // 3. Income Fields Validation (Reject Negative Numbers)
  const income = payload.income || {};

  const validateNonNegative = (val, fieldPath) => {
    if (val !== undefined && val !== null) {
      const num = Number(val);
      if (isNaN(num)) {
        errors.push({ field: fieldPath, message: `${fieldPath} must be a valid number.` });
      } else if (num < 0) {
        errors.push({ field: fieldPath, message: `${fieldPath} cannot be negative.` });
      }
    }
  };

  // Salary subfields
  const salary = income.salary || {};
  validateNonNegative(salary.basicSalary ?? income.salaryIncome, 'income.salary.basicSalary');
  validateNonNegative(salary.houseRentAllowance ?? income.houseRentAllowance, 'income.salary.houseRentAllowance');
  validateNonNegative(salary.medicalAllowance ?? income.medicalAllowance, 'income.salary.medicalAllowance');
  validateNonNegative(salary.conveyanceAllowance ?? income.conveyanceAllowance, 'income.salary.conveyanceAllowance');
  validateNonNegative(salary.festivalBonus ?? income.festivalBonus, 'income.salary.festivalBonus');
  validateNonNegative(salary.otherAllowances ?? income.otherAllowances, 'income.salary.otherAllowances');

  // Other heads
  validateNonNegative(income.houseProperty ?? income.housePropertyIncome, 'income.houseProperty');
  validateNonNegative(income.agriculture ?? income.agricultureIncome, 'income.agriculture');
  validateNonNegative(income.business ?? income.businessIncome, 'income.business');
  validateNonNegative(income.capitalGain ?? income.capitalGains, 'income.capitalGain');
  validateNonNegative(income.financialAssets ?? income.financialAssetsIncome, 'income.financialAssets');
  validateNonNegative(income.otherSources ?? income.otherIncome, 'income.otherSources');

  // 4. Investments / Rebates (Reject Negative Numbers)
  const rebates = payload.rebates || payload.investments || {};
  validateNonNegative(rebates.dps, 'rebates.dps');
  validateNonNegative(rebates.sanchayapatra, 'rebates.sanchayapatra');
  validateNonNegative(rebates.lifeInsurance, 'rebates.lifeInsurance');
  validateNonNegative(rebates.stockMarket, 'rebates.stockMarket');
  validateNonNegative(rebates.providentFund, 'rebates.providentFund');
  validateNonNegative(rebates.otherEligible, 'rebates.otherEligible');

  // 5. Net Wealth (Reject Negative Numbers)
  if (payload.otherInformation?.netWealth !== undefined) {
    validateNonNegative(payload.otherInformation.netWealth, 'otherInformation.netWealth');
  }

  if (errors.length > 0) {
    throw new TaxValidationError('Tax calculation input validation failed.', errors);
  }

  return true;
};

export class TaxValidation {
  static validate(payload) {
    return validateTaxCalculationPayload(payload);
  }
}

export default TaxValidation;

