import { Money } from './Money.js';

/**
 * SurchargeCalculator
 *
 * Computes individual Net Wealth Surcharge under the Finance Act 2024.
 * Surcharge is assessed on the final tax liability before surcharge.
 */
export class SurchargeCalculator {
  static calculate(baseTaxLiability, otherInfo = {}, surchargeRules = []) {
    const baseTax = Money.from(baseTaxLiability);
    const netWealth = Money.from(otherInfo.netWealth || 0);
    const ownsMultipleCars = Boolean(otherInfo.ownsMultipleCars);
    const ownsLargeHouseProperty = Boolean(otherInfo.ownsLargeHouseProperty); // 8,000+ sq ft

    let surchargeRate = 0;
    let applicableTierDescription = 'Up to ৳4 Crore (0% Surcharge)';

    // Special condition: Owning 2+ motor cars or 8,000+ sq ft house triggers at least 10% surcharge
    if ((ownsMultipleCars || ownsLargeHouseProperty) && netWealth <= 40000000) {
      surchargeRate = 10;
      applicableTierDescription = '10% Surcharge (Triggered by multiple motor cars or 8,000+ sq ft residential property)';
    } else if (netWealth > 500000000) {
      // > 50 Crore
      surchargeRate = 35;
      applicableTierDescription = 'Exceeding ৳50 Crore (35% Surcharge)';
    } else if (netWealth > 200000000) {
      // 20 Cr to 50 Cr
      surchargeRate = 30;
      applicableTierDescription = '৳20 Crore to ৳50 Crore (30% Surcharge)';
    } else if (netWealth > 100000000) {
      // 10 Cr to 20 Cr
      surchargeRate = 20;
      applicableTierDescription = '৳10 Crore to ৳20 Crore (20% Surcharge)';
    } else if (netWealth > 40000000) {
      // 4 Cr to 10 Cr
      surchargeRate = 10;
      applicableTierDescription = '৳4 Crore to ৳10 Crore (10% Surcharge)';
    }

    // Lookup custom database surcharge rules if available
    if (Array.isArray(surchargeRules) && surchargeRules.length > 0 && netWealth > 40000000) {
      const match = surchargeRules.find((r) => {
        const lower = r.lowerNetWealth || 0;
        const upper = r.upperNetWealth || Infinity;
        return netWealth > lower && netWealth <= upper;
      });
      if (match) {
        surchargeRate = match.surchargeRate;
        applicableTierDescription = match.description || applicableTierDescription;
      }
    }

    const surchargeAmount = baseTax > 0 ? Money.percentage(baseTax, surchargeRate) : 0;

    return {
      netWealth: Money.from(netWealth),
      surchargeRate,
      tierDescription: applicableTierDescription,
      baseTaxLiability: Money.from(baseTax),
      surchargeAmount: Money.from(surchargeAmount),
    };
  }
}

export default SurchargeCalculator;
