import { Money } from './Money.js';

/**
 * TaxSlabCalculator
 *
 * Implements progressive tiered income tax slab computation under Bangladesh Income Tax Act 2023.
 */
export class TaxSlabCalculator {
  static calculate(taxableIncome, taxFreeThreshold, slabs = []) {
    const totalTaxable = Money.from(taxableIncome);
    const threshold = Money.from(taxFreeThreshold);

    // Initial tax-free tier breakdown entry
    const breakdown = [
      {
        sequence: 1,
        slabDescription: `First ${Money.format(threshold)} (Tax Free Basic Exemption)`,
        taxableAmountInSlab: Money.min(totalTaxable, threshold),
        rate: 0,
        taxInSlab: 0,
      },
    ];

    // If total taxable income does not exceed the threshold, tax is 0
    if (totalTaxable <= threshold) {
      return {
        regularTax: 0,
        slabBreakdown: breakdown,
      };
    }

    let remainingTaxable = Money.subtract(totalTaxable, threshold);
    let totalGrossTax = 0;

    // Standard default progressive slabs if database rules are not provided
    const defaultSlabs = [
      { sequence: 2, limit: 100000, rate: 5, description: 'Next ৳1,00,000 (5%)' },
      { sequence: 3, limit: 400000, rate: 10, description: 'Next ৳4,00,000 (10%)' },
      { sequence: 4, limit: 500000, rate: 15, description: 'Next ৳5,00,000 (15%)' },
      { sequence: 5, limit: 500000, rate: 20, description: 'Next ৳5,00,000 (20%)' },
      { sequence: 6, limit: Infinity, rate: 25, description: 'Remaining Balance (25%)' },
    ];

    // Convert database slabs if available (ignoring the first 0% slab as threshold is already handled)
    let activeSlabs = defaultSlabs;
    if (Array.isArray(slabs) && slabs.length > 1) {
      const positiveSlabs = slabs.filter((s) => s.rate > 0).sort((a, b) => a.sequence - b.sequence);
      if (positiveSlabs.length > 0) {
        activeSlabs = positiveSlabs.map((s) => {
          const limit = s.upperLimit === null || s.upperLimit === undefined
            ? Infinity
            : s.upperLimit - s.lowerLimit;
          return {
            sequence: s.sequence,
            limit,
            rate: s.rate,
            description: s.description || `Next ${Money.format(limit)} (${s.rate}%)`,
          };
        });
      }
    }

    for (const slab of activeSlabs) {
      if (remainingTaxable <= 0) break;

      const taxableInThisSlab = slab.limit === Infinity ? remainingTaxable : Money.min(remainingTaxable, slab.limit);
      const taxInThisSlab = Money.percentage(taxableInThisSlab, slab.rate);

      totalGrossTax = Money.add(totalGrossTax, taxInThisSlab);
      remainingTaxable = Money.subtract(remainingTaxable, taxableInThisSlab);

      breakdown.push({
        sequence: slab.sequence,
        slabDescription: slab.description,
        taxableAmountInSlab: Money.from(taxableInThisSlab),
        rate: slab.rate,
        taxInSlab: Money.from(taxInThisSlab),
      });
    }

    return {
      regularTax: Money.from(totalGrossTax),
      slabBreakdown: breakdown,
    };
  }
}

export default TaxSlabCalculator;
