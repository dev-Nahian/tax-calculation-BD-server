/**
 * Exemption calculations under Bangladesh Income Tax Act 2023
 * Note: Foundation skeleton for tax engine. Detailed rule implementations in next phase.
 */

export const calculateSalaryExemptions = (salaryInputs, rules) => {
  // Placeholder foundation logic
  const basicSalary = salaryInputs.salaryIncome || 0;
  const houseRent = salaryInputs.houseRentAllowance || 0;
  const medical = salaryInputs.medicalAllowance || 0;
  const conveyance = salaryInputs.conveyanceAllowance || 0;

  // Standard NBR limits placeholder
  const houseRentExempt = Math.min(houseRent, (basicSalary * 0.5), 300000);
  const medicalExempt = Math.min(medical, (basicSalary * 0.1), 120000);
  const conveyanceExempt = Math.min(conveyance, 30000);

  return {
    houseRentExempt,
    medicalExempt,
    conveyanceExempt,
    totalSalaryExemptions: houseRentExempt + medicalExempt + conveyanceExempt,
  };
};

export const getCategoryExemptionLimit = (category, rules) => {
  const thresholds = rules?.exemptionThresholds || {
    general: 350000,
    female: 400000,
    senior: 400000,
    disabled: 475000,
    gazettedFreedomFighter: 500000,
  };

  return thresholds[category] || thresholds.general;
};
