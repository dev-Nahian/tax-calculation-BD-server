import { Money } from './Money.js';

/**
 * TaxRebateCalculator
 *
 * Computes Section 78 Investment Tax Rebate under Bangladesh Income Tax Act 2023.
 */
export class TaxRebateCalculator {
  static calculate(taxableIncome, investments = {}, rebateRules = []) {
    const netTaxableIncome = Money.from(taxableIncome);

    // Sum all qualifying investment sectors with statutory sub-caps
    const dps = Money.min(investments.dps || 0, 120000); // DPS statutory cap ৳1.2L/year
    const sanchayapatra = Money.from(investments.sanchayapatra || 0);
    const lifeInsurance = Money.from(investments.lifeInsurance || 0);
    const stockMarket = Money.from(investments.stockMarket || 0);
    const providentFund = Money.from(investments.providentFund || 0);
    const otherEligible = Money.from(investments.otherEligible || 0);

    const actualTotalInvestments = Money.add(
      dps,
      sanchayapatra,
      lifeInsurance,
      stockMarket,
      providentFund,
      otherEligible
    );

    // Default Section 78 rule parameters
    let rebateRate = 15; // 15%
    let maxIncomePercentage = 20; // 20% of taxable income
    let maxStatutoryCap = 1000000; // ৳10,00,000

    if (Array.isArray(rebateRules) && rebateRules.length > 0) {
      const primaryRule = rebateRules[0];
      rebateRate = primaryRule.percentage || 15;
      maxIncomePercentage = primaryRule.maxInvestmentPercentageOfIncome || 20;
      maxStatutoryCap = primaryRule.maximumAmount || 1000000;
    }

    // 20% of taxable income ceiling
    const incomeCeiling = Money.percentage(netTaxableIncome, maxIncomePercentage);

    // Allowable investment is the lowest of: (1) Actual, (2) 20% of Taxable Income, (3) ৳10 Lakh
    const allowableInvestment = Money.min(actualTotalInvestments, incomeCeiling, maxStatutoryCap);

    // Section 78 Rebate = Allowable Investment * 15%
    const rebateAmount = Money.percentage(allowableInvestment, rebateRate);

    return {
      actualInvestments: Money.from(actualTotalInvestments),
      investmentBreakdown: {
        dps,
        sanchayapatra,
        lifeInsurance,
        stockMarket,
        providentFund,
        otherEligible,
      },
      incomeCeiling: Money.from(incomeCeiling),
      maxStatutoryCap: Money.from(maxStatutoryCap),
      allowableInvestment: Money.from(allowableInvestment),
      rebateRate,
      rebateAmount: Money.from(rebateAmount),
    };
  }
}

export default TaxRebateCalculator;
