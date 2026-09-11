/**
 * Slab calculations for progressive income tax brackets
 */

export const calculateTaxOnSlabs = (taxableIncome, exemptionLimit, slabs) => {
  // Foundation placeholder for progressive tax slab calculation
  if (taxableIncome <= exemptionLimit) {
    return {
      grossTax: 0,
      breakdown: [
        {
          slab: `Initial Exemption (up to ৳${exemptionLimit.toLocaleString()})`,
          rate: 0,
          amountInSlab: taxableIncome,
          taxInSlab: 0,
        },
      ],
    };
  }

  let remainingTaxable = taxableIncome - exemptionLimit;
  let totalGrossTax = 0;
  const breakdown = [
    {
      slab: `Initial Exemption (up to ৳${exemptionLimit.toLocaleString()})`,
      rate: 0,
      amountInSlab: exemptionLimit,
      taxInSlab: 0,
    },
  ];

  const defaultSlabs = [
    { limit: 100000, rate: 0.05, label: 'Next ৳1,00,000' },
    { limit: 400000, rate: 0.10, label: 'Next ৳4,00,000' },
    { limit: 500000, rate: 0.15, label: 'Next ৳5,00,000' },
    { limit: 500000, rate: 0.20, label: 'Next ৳5,00,000' },
    { limit: Infinity, rate: 0.25, label: 'Remaining Balance' },
  ];

  for (const slab of defaultSlabs) {
    if (remainingTaxable <= 0) break;

    const taxedAmount = slab.limit === Infinity ? remainingTaxable : Math.min(remainingTaxable, slab.limit);
    const taxInThisSlab = taxedAmount * slab.rate;

    totalGrossTax += taxInThisSlab;
    remainingTaxable -= taxedAmount;

    breakdown.push({
      slab: `${slab.label} (${slab.rate * 100}%)`,
      rate: slab.rate * 100,
      amountInSlab: taxedAmount,
      taxInSlab: taxInThisSlab,
    });
  }

  return {
    grossTax: Math.round(totalGrossTax),
    breakdown,
  };
};
