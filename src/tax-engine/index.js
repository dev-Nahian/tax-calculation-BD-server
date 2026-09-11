import { calculateSalaryExemptions, getCategoryExemptionLimit } from './exemptions.js';
import { calculateTaxOnSlabs } from './slabs.js';
import { calculateInvestmentRebate, getMinimumTax } from './rebates.js';
import { TAX_CATEGORIES, TAX_ZONES } from './constants.js';

/**
 * Tax Engine Entry Point (Foundation Skeleton)
 * Orchestrates income computation, exemption, slabs, rebates, and minimum tax.
 */
export const estimateTax = (payload, rule) => {
  const {
    category = TAX_CATEGORIES.GENERAL,
    zone = TAX_ZONES.DHAKA_CHATTOGRAM,
    inputs = {},
  } = payload;

  const basicSalary = Number(inputs.salaryIncome || 0);
  const houseRent = Number(inputs.houseRentAllowance || 0);
  const medical = Number(inputs.medicalAllowance || 0);
  const conveyance = Number(inputs.conveyanceAllowance || 0);
  const festivalBonus = Number(inputs.festivalBonus || 0);
  const otherAllowances = Number(inputs.otherAllowances || 0);

  const businessIncome = Number(inputs.businessIncome || 0);
  const housePropertyIncome = Number(inputs.housePropertyIncome || 0);
  const agricultureIncome = Number(inputs.agricultureIncome || 0);
  const capitalGains = Number(inputs.capitalGains || 0);
  const otherIncome = Number(inputs.otherIncome || 0);

  const grossSalary = basicSalary + houseRent + medical + conveyance + festivalBonus + otherAllowances;
  const grossIncome = grossSalary + businessIncome + housePropertyIncome + agricultureIncome + capitalGains + otherIncome;

  const salaryExemptions = calculateSalaryExemptions(
    { salaryIncome: basicSalary, houseRentAllowance: houseRent, medicalAllowance: medical, conveyanceAllowance: conveyance },
    rule
  );

  const totalExemptions = salaryExemptions.totalSalaryExemptions;
  const taxableIncome = Math.max(0, grossIncome - totalExemptions);

  const exemptionLimit = getCategoryExemptionLimit(category, rule);
  const slabCalc = calculateTaxOnSlabs(taxableIncome, exemptionLimit, rule?.slabs);

  const investments = inputs.investments || {};
  const totalInvestmentAmount = Object.values(investments).reduce((acc, val) => acc + Number(val || 0), 0);

  const rebateCalc = calculateInvestmentRebate(taxableIncome, totalInvestmentAmount, rule?.investmentRebate);

  let netTax = Math.max(0, slabCalc.grossTax - rebateCalc.calculatedRebate);
  const minTax = getMinimumTax(zone, rule);

  let finalTaxLiability = 0;
  if (taxableIncome > exemptionLimit) {
    finalTaxLiability = Math.max(netTax, minTax);
  }

  const effectiveTaxRate = grossIncome > 0 ? ((finalTaxLiability / grossIncome) * 100).toFixed(2) : 0;

  return {
    grossIncome: Math.round(grossIncome),
    totalExemptions: Math.round(totalExemptions),
    taxableIncome: Math.round(taxableIncome),
    exemptionLimit: Math.round(exemptionLimit),
    grossTaxLiability: slabCalc.grossTax,
    eligibleInvestment: rebateCalc.eligibleInvestment,
    investmentRebate: rebateCalc.calculatedRebate,
    netTaxBeforeMinimum: netTax,
    minimumTax: minTax,
    finalTaxLiability: Math.round(finalTaxLiability),
    effectiveTaxRate: Number(effectiveTaxRate),
    slabBreakdown: slabCalc.breakdown,
  };
};

export * from './constants.js';
export * from './exemptions.js';
export * from './slabs.js';
export * from './rebates.js';
