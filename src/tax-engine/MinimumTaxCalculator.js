import { Money } from './Money.js';

/**
 * MinimumTaxCalculator
 *
 * Evaluates geographical minimum tax requirement under Section 73 of Bangladesh Income Tax Act 2023.
 */
export class MinimumTaxCalculator {
  static calculate(taxableIncome, taxFreeThreshold, taxAfterRebate, zone = 'dhaka_chattogram', minimumTaxRules = []) {
    const netTaxableIncome = Money.from(taxableIncome);
    const threshold = Money.from(taxFreeThreshold);
    const netTaxAfterRebate = Money.from(taxAfterRebate);

    // Default zone minimum tax amounts
    const defaultZoneRates = {
      dhaka_chattogram: 5000,
      other_city_corporation: 4000,
      non_city_corporation: 3000,
    };

    let requiredMinimumTax = defaultZoneRates[zone] || defaultZoneRates.dhaka_chattogram;

    if (Array.isArray(minimumTaxRules) && minimumTaxRules.length > 0) {
      const match = minimumTaxRules.find((r) => r.zone === zone);
      if (match && match.amount) {
        requiredMinimumTax = match.amount;
      }
    }

    // Minimum tax is only triggered if taxable income exceeds the tax-free exemption limit
    if (netTaxableIncome <= threshold) {
      return {
        applicable: false,
        zone,
        statutoryMinimum: Money.from(requiredMinimumTax),
        payableTax: 0,
        isMinimumTaxEnforced: false,
        reason: 'Taxable income does not exceed basic tax-free threshold.',
      };
    }

    const isMinimumTaxEnforced = netTaxAfterRebate < requiredMinimumTax;
    const payableTax = Money.max(netTaxAfterRebate, requiredMinimumTax);

    return {
      applicable: true,
      zone,
      statutoryMinimum: Money.from(requiredMinimumTax),
      payableTax: Money.from(payableTax),
      isMinimumTaxEnforced,
      reason: isMinimumTaxEnforced
        ? `Net tax (৳${netTaxAfterRebate.toLocaleString()}) was below the statutory minimum for ${zone}. Raised to ৳${requiredMinimumTax.toLocaleString()}.`
        : 'Regular progressive tax after rebate exceeds statutory minimum.',
    };
  }
}

export default MinimumTaxCalculator;
