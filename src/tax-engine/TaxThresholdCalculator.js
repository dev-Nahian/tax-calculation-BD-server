import { Money } from './Money.js';

/**
 * TaxThresholdCalculator
 *
 * Resolves the statutory tax-free exemption limit based on:
 * - Taxpayer Category (general, female, seniorCitizen, thirdGender, disabled, freedomFighter, parentOfDisabled)
 * - Age qualification (Age 65+ receives senior citizen ceiling)
 * - Dependent allowances (৳50,000 per disabled dependent child)
 */
export class TaxThresholdCalculator {
  static calculate(profile = {}, thresholds = []) {
    const category = profile.category || 'general';
    const age = Number(profile.age || 0);
    const hasDisabledChild = Boolean(profile.hasDisabledChild);
    const disabledChildrenCount = Number(profile.disabledChildrenCount || (hasDisabledChild ? 1 : 0));

    // Default fallback limits if database threshold is missing
    const defaultThresholds = {
      general: 350000,
      female: 400000,
      seniorCitizen: 400000,
      thirdGender: 400000,
      disabled: 475000,
      freedomFighter: 500000,
      parentOfDisabled: 400000,
    };

    // Auto-upgrade to senior citizen if age >= 65 and currently general
    let effectiveCategory = category;
    if (age >= 65 && effectiveCategory === 'general') {
      effectiveCategory = 'seniorCitizen';
    }

    // Lookup threshold from database rules if available
    let baseLimit = defaultThresholds[effectiveCategory] || defaultThresholds.general;
    let allowancePerChild = 50000;

    if (Array.isArray(thresholds) && thresholds.length > 0) {
      const match = thresholds.find((t) => t.taxpayerCategory === effectiveCategory);
      if (match) {
        baseLimit = match.taxFreeLimit;
        allowancePerChild = match.additionalDependentAllowance || 50000;
      }
    }

    // Additional allowance for parent/legal guardian of disabled child
    const dependentExemption = disabledChildrenCount > 0 ? Money.multiply(allowancePerChild, disabledChildrenCount) : 0;
    const totalTaxFreeLimit = Money.add(baseLimit, dependentExemption);

    return {
      category: effectiveCategory,
      baseLimit: Money.from(baseLimit),
      disabledChildrenCount,
      allowancePerChild: Money.from(allowancePerChild),
      dependentExemption: Money.from(dependentExemption),
      totalTaxFreeLimit: Money.from(totalTaxFreeLimit),
    };
  }
}

export default TaxThresholdCalculator;
