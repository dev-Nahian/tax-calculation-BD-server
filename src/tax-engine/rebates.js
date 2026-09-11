/**
 * Investment Tax Rebate calculations under Section 78 of Bangladesh Income Tax Act 2023
 */

export const calculateInvestmentRebate = (taxableIncome, totalInvestments, ruleConfig) => {
  // Max allowable investment is lower of:
  // 1. Actual investment
  // 2. 20% of total taxable income
  // 3. Cap (e.g. 10,00,000 BDT)
  const maxAllowablePercentage = (ruleConfig?.maxInvestmentPercentageOfTotalIncome || 20) / 100;
  const maxCap = ruleConfig?.maxAllowableInvestmentCap || 1000000;
  const rebateRate = (ruleConfig?.rebateRate || 15) / 100;

  const allowableLimit = Math.min(taxableIncome * maxAllowablePercentage, maxCap);
  const eligibleInvestment = Math.min(totalInvestments, allowableLimit);
  const calculatedRebate = eligibleInvestment * rebateRate;

  return {
    allowableLimit: Math.round(allowableLimit),
    eligibleInvestment: Math.round(eligibleInvestment),
    calculatedRebate: Math.round(calculatedRebate),
  };
};

export const getMinimumTax = (zone, ruleConfig) => {
  const minTaxMap = ruleConfig?.minimumTax || {
    dhaka_chattogram: 5000,
    other_city_corporation: 4000,
    non_city_corporation: 3000,
  };
  return minTaxMap[zone] || minTaxMap.dhaka_chattogram || 5000;
};
