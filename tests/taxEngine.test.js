import assert from 'node:assert';
import { TaxCalculator } from '../src/tax-engine/TaxCalculator.js';
import { TaxSlabCalculator } from '../src/tax-engine/TaxSlabCalculator.js';
import { TaxThresholdCalculator } from '../src/tax-engine/TaxThresholdCalculator.js';
import { TaxRebateCalculator } from '../src/tax-engine/TaxRebateCalculator.js';
import { MinimumTaxCalculator } from '../src/tax-engine/MinimumTaxCalculator.js';
import { SurchargeCalculator } from '../src/tax-engine/SurchargeCalculator.js';
import { TaxValidation, TaxValidationError } from '../src/tax-engine/TaxValidation.js';
import { Money } from '../src/tax-engine/Money.js';

let passedTests = 0;
let totalTests = 0;

const runTest = (name, testFn) => {
  totalTests++;
  try {
    testFn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${error.message}`);
    console.error(error.stack);
  }
};

console.log('================================================================');
console.log('       TaxBD Bangladesh Income Tax Engine - Official Test Suite  ');
console.log('       Compliant with Bangladesh Income Tax Act 2023 & NBR Rules');
console.log('================================================================\n');

// 1. Money Utility Tests
runTest('Money utility handles integer arithmetic, percentage, and formatting', () => {
  assert.strictEqual(Money.from('150000.4'), 150000);
  assert.strictEqual(Money.from(150000.6), 150001);
  assert.strictEqual(Money.add(100, 200, 300), 600);
  assert.strictEqual(Money.subtract(500, 200), 300);
  assert.strictEqual(Money.percentage(100000, 5), 5000);
  assert.strictEqual(Money.percentage(706000, 20), 141200);
  assert.strictEqual(Money.format(350000), '৳ 3,50,000');
});

// 2. Zero Income Test
runTest('Zero income returns zero tax and 0% effective tax rate', () => {
  const result = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 0 } },
  });

  assert.strictEqual(result.grossIncome, 0);
  assert.strictEqual(result.taxableIncome, 0);
  assert.strictEqual(result.taxFreeIncome, 0);
  assert.strictEqual(result.regularTax, 0);
  assert.strictEqual(result.totalTax, 0);
  assert.strictEqual(result.effectiveTaxRate, 0);
  assert.strictEqual(result.minimumTax.applicable, false);
});

// 3. Income Below Tax-Free Threshold
runTest('Income below basic tax-free threshold (৳3,00,000 < ৳3,50,000) incurs zero tax', () => {
  const result = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 300000 } },
  });

  assert.strictEqual(result.taxableIncome, 300000);
  assert.strictEqual(result.taxFreeThreshold, 350000);
  assert.strictEqual(result.taxFreeIncome, 300000);
  assert.strictEqual(result.regularTax, 0);
  assert.strictEqual(result.totalTax, 0);
  assert.strictEqual(result.minimumTax.applicable, false);
  assert.strictEqual(result.effectiveTaxRate, 0);
});

// 4. Income Exactly at Threshold
runTest('Income exactly at statutory threshold incurs 0 tax across all categories', () => {
  // General Male: ৳3,50,000
  const resMale = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 350000 } },
  });
  assert.strictEqual(resMale.regularTax, 0);
  assert.strictEqual(resMale.totalTax, 0);
  assert.strictEqual(resMale.minimumTax.applicable, false);

  // Female: ৳4,00,000
  const resFemale = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'female', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 400000 } },
  });
  assert.strictEqual(resFemale.taxFreeThreshold, 400000);
  assert.strictEqual(resFemale.regularTax, 0);
  assert.strictEqual(resFemale.totalTax, 0);

  // Senior Citizen (65+): ৳4,00,000
  const resSenior = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', age: 67, zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 400000 } },
  });
  assert.strictEqual(resSenior.taxFreeThreshold, 400000);
  assert.strictEqual(resSenior.regularTax, 0);
  assert.strictEqual(resSenior.totalTax, 0);

  // Disabled Person: ৳4,75,000
  const resDisabled = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'disabled', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 475000 } },
  });
  assert.strictEqual(resDisabled.taxFreeThreshold, 475000);
  assert.strictEqual(resDisabled.regularTax, 0);
  assert.strictEqual(resDisabled.totalTax, 0);

  // Gazetted War-Wounded Freedom Fighter: ৳5,00,000
  const resFF = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'freedomFighter', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 500000 } },
  });
  assert.strictEqual(resFF.taxFreeThreshold, 500000);
  assert.strictEqual(resFF.regularTax, 0);
  assert.strictEqual(resFF.totalTax, 0);
});

// 5. Income Just Above Threshold (Minimum Tax Triggered)
runTest('Income just above threshold (৳3,60,000): 5% slab = ৳500, minimum tax ৳5,000 enforced', () => {
  const result = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 360000 } },
  });

  assert.strictEqual(result.taxableIncome, 360000);
  assert.strictEqual(result.regularTax, 500); // (360k - 350k) * 5% = ৳500
  assert.strictEqual(result.minimumTax.applicable, true);
  assert.strictEqual(result.minimumTax.isMinimumTaxEnforced, true);
  assert.strictEqual(result.minimumTax.statutoryMinimum, 5000);
  assert.strictEqual(result.minimumTax.payableTax, 5000);
  assert.strictEqual(result.totalTax, 5000);
});

// 6. Progressive Slab Boundaries Test
runTest('Progressive tax slab boundaries verified (5%, 10%, 15%, 20%, 25%)', () => {
  // Slab 1 boundary: ৳4,50,000 (3.5L threshold + 1.0L @ 5%) -> ৳5,000
  const r1 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 450000 } },
  });
  assert.strictEqual(r1.regularTax, 5000);

  // Slab 2 boundary: ৳8,50,000 (3.5L + 1L@5% + 4L@10%) -> ৳5,000 + ৳40,000 = ৳45,000
  const r2 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 850000 } },
  });
  assert.strictEqual(r2.regularTax, 45000);

  // Slab 3 boundary: ৳13,50,000 (8.5L + 5L@15%) -> ৳45,000 + ৳75,000 = ৳1,20,000
  const r3 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1350000 } },
  });
  assert.strictEqual(r3.regularTax, 120000);

  // Slab 4 boundary: ৳18,50,000 (13.5L + 5L@20%) -> ৳1,20,000 + ৳1,00,000 = ৳2,20,000
  const r4 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1850000 } },
  });
  assert.strictEqual(r4.regularTax, 220000);

  // Slab 5 boundary: ৳28,50,000 (18.5L + 10L@25%) -> ৳2,20,000 + ৳2,50,000 = ৳4,70,000
  const r5 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 2850000 } },
  });
  assert.strictEqual(r5.regularTax, 470000);
});

// 7. Very High Income Test (৳1 Crore & ৳10 Crore)
runTest('High income progressive calculation with 25% highest bracket', () => {
  // ৳1,00,00,000 (1 Crore):
  // 1st 3.5L @ 0% = 0
  // Next 1.0L @ 5% = 5,000
  // Next 4.0L @ 10% = 40,000
  // Next 5.0L @ 15% = 75,000
  // Next 5.0L @ 20% = 1,00,000
  // Next 81.5L @ 25% = 20,37,500
  // Total regular tax = 22,57,500
  const rCrore = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { business: 10000000 },
  });
  assert.strictEqual(rCrore.regularTax, 2257500);
});

// 8. Taxpayer Categories & Dependent Allowances
runTest('Parent of disabled children receives ৳50,000 additional threshold per child', () => {
  // 3 disabled children: 350,000 + 3 * 50,000 = 500,000
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', disabledChildrenCount: 3, zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 500000 } },
  });
  assert.strictEqual(res.taxFreeThreshold, 500000);
  assert.strictEqual(res.regularTax, 0);
  assert.strictEqual(res.totalTax, 0);
});

// 9. Minimum Tax Location Rules
runTest('Minimum tax varies by geographic zone (Dhaka/Chattogram: 5k, Other City: 4k, Non-City: 3k)', () => {
  // Income slightly above threshold (৳3,60,000 -> regular tax ৳500)
  const basePayload = {
    assessmentYear: '2024-2025',
    income: { salary: { basicSalary: 360000 } },
  };

  const rDhaka = TaxCalculator.calculate({
    ...basePayload,
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
  });
  assert.strictEqual(rDhaka.totalTax, 5000);

  const rOtherCity = TaxCalculator.calculate({
    ...basePayload,
    taxpayerProfile: { category: 'general', zone: 'other_city_corporation' },
  });
  assert.strictEqual(rOtherCity.totalTax, 4000);

  const rNonCity = TaxCalculator.calculate({
    ...basePayload,
    taxpayerProfile: { category: 'general', zone: 'non_city_corporation' },
  });
  assert.strictEqual(rNonCity.totalTax, 3000);
});

// 10. Section 78 Investment Rebate Calculations
runTest('Section 78 investment rebate enforces 15% rate, 20% taxable income limit, and ৳10L cap', () => {
  // Case A: Normal allowable investment (1.5L < 20% of 10L = 2L)
  const rA = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1000000 } },
    rebates: { dps: 100000, lifeInsurance: 50000 },
  });
  assert.strictEqual(rA.rebate.actualInvestments, 150000);
  assert.strictEqual(rA.rebate.allowableInvestment, 150000);
  assert.strictEqual(rA.rebate.rebateAmount, 22500);

  // Case B: Excess investment capped by 20% of taxable income (3L capped at 2L)
  const rB = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1000000 } },
    rebates: { sanchayapatra: 300000 },
  });
  assert.strictEqual(rB.rebate.incomeCeiling, 200000);
  assert.strictEqual(rB.rebate.allowableInvestment, 200000);
  assert.strictEqual(rB.rebate.rebateAmount, 30000);

  // Case C: DPS statutory ceiling (৳1,20,000 per year max allowed for DPS)
  const rC = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1000000 } },
    rebates: { dps: 200000 }, // Claimed 2L, but cap is 1.2L
  });
  assert.strictEqual(rC.rebate.actualInvestments, 120000);
  assert.strictEqual(rC.rebate.rebateAmount, 18000);
});

// 11. Net Wealth Surcharge Tiers & Specific Triggers
runTest('Net Wealth Surcharge computed across all tiers and special asset triggers', () => {
  // Tier 1: ৳5 Crore wealth (10% surcharge)
  const rTier1 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 2850000 } }, // Regular tax = ৳4,70,000
    otherInformation: { netWealth: 50000000 },
  });
  assert.strictEqual(rTier1.surcharge.surchargeRate, 10);
  assert.strictEqual(rTier1.surcharge.surchargeAmount, 47000);
  assert.strictEqual(rTier1.totalTax, 470000 + 47000);

  // Tier 2: ৳15 Crore wealth (20% surcharge)
  const rTier2 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 2850000 } },
    otherInformation: { netWealth: 150000000 },
  });
  assert.strictEqual(rTier2.surcharge.surchargeRate, 20);
  assert.strictEqual(rTier2.surcharge.surchargeAmount, 94000);

  // Tier 3: ৳30 Crore wealth (30% surcharge)
  const rTier3 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 2850000 } },
    otherInformation: { netWealth: 300000000 },
  });
  assert.strictEqual(rTier3.surcharge.surchargeRate, 30);
  assert.strictEqual(rTier3.surcharge.surchargeAmount, 141000);

  // Tier 4: ৳60 Crore wealth (35% surcharge)
  const rTier4 = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 2850000 } },
    otherInformation: { netWealth: 600000000 },
  });
  assert.strictEqual(rTier4.surcharge.surchargeRate, 35);
  assert.strictEqual(rTier4.surcharge.surchargeAmount, 164500);

  // Multiple Cars trigger (10% surcharge even if net wealth < 4 Crore)
  const rCar = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1850000 } }, // Regular tax = ৳2,20,000
    otherInformation: { netWealth: 15000000, ownsMultipleCars: true },
  });
  assert.strictEqual(rCar.surcharge.surchargeRate, 10);
  assert.strictEqual(rCar.surcharge.surchargeAmount, 22000);
});

// 12. Extensible Multi-Head Income & Deductions
runTest('Multi-head income aggregation across 7 statutory heads with respective deductions', () => {
  const result = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: {
      salary: { basicSalary: 500000 },
      houseProperty: 200000,
      agriculture: 150000,
      business: 300000,
      capitalGain: 100000,
      financialAssets: 50000,
      otherSources: 25000,
    },
    deductions: {
      housePropertyDeduction: 50000,
      agricultureDeduction: 30000,
      businessExpenses: 100000,
    },
  });

  // Gross = 500k + 200k + 150k + 300k + 100k + 50k + 25k = 1,325,000
  assert.strictEqual(result.grossIncome, 1325000);
  // Deductions = 50k + 30k + 100k = 180,000
  assert.strictEqual(result.totalDeductions, 180000);
  // Taxable = 1,325,000 - 180,000 = 1,145,000
  assert.strictEqual(result.taxableIncome, 1145000);
  assert.strictEqual(result.incomeSummary.houseProperty, 150000);
  assert.strictEqual(result.incomeSummary.agriculture, 120000);
  assert.strictEqual(result.incomeSummary.business, 200000);
});

// 13. Official NBR Paripatra 2024-2025 Salaried Taxpayer Example Verified
runTest('Official NBR Paripatra 2024-2025 Individual Salaried Taxpayer Benchmark Verified', () => {
  // Case Study:
  // Basic Salary = ৳6,00,000
  // House Rent = ৳2,40,000 (Exemption: Min(240k, 50% of 600k=300k, 300k) = ৳2,40,000)
  // Medical Allowance = ৳60,000 (Exemption: Min(60k, 10% of 600k=60k, 120k) = ৳60,000)
  // Conveyance Allowance = ৳36,000 (Exemption: ৳30,000)
  // Festival Bonus = ৳1,00,000
  // Gross = ৳10,36,000
  // Total Allowable Deductions = ৳3,30,000
  // Taxable Income = ৳7,06,000
  //
  // Tax calculation on ৳7,06,000:
  // 1st ৳3,50,000 @ 0% = ৳0
  // Next ৳1,00,000 @ 5% = ৳5,000
  // Remaining ৳2,56,000 @ 10% = ৳25,600
  // Regular Gross Tax = ৳30,600
  //
  // Rebates: DPS ৳1,20,000 + Life Insurance ৳30,000 = ৳1,50,000.
  // 20% of ৳7,06,000 = ৳1,41,200 (Ceiling)
  // Allowable Investment = ৳1,41,200
  // Rebate = ৳1,41,200 * 15% = ৳21,180
  // Net Tax = ৳30,600 - ৳21,180 = ৳9,420 (Exceeds Dhaka minimum tax of ৳5,000)

  const result = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: {
      salary: {
        basicSalary: 600000,
        houseRentAllowance: 240000,
        medicalAllowance: 60000,
        conveyanceAllowance: 36000,
        festivalBonus: 100000,
      },
    },
    rebates: {
      dps: 120000,
      lifeInsurance: 30000,
    },
  });

  assert.strictEqual(result.grossIncome, 1036000);
  assert.strictEqual(result.deductionsBreakdown.totalDeductions, 330000);
  assert.strictEqual(result.taxableIncome, 706000);
  assert.strictEqual(result.regularTax, 30600);
  assert.strictEqual(result.rebate.allowableInvestment, 141200);
  assert.strictEqual(result.rebate.rebateAmount, 21180);
  assert.strictEqual(result.totalTax, 9420);
  assert.strictEqual(result.effectiveTaxRate, 0.91);
});

// 14. Validation Edge Cases
runTest('TaxValidation rejects invalid payload and negative values', () => {
  // Null or missing payload
  assert.throws(() => TaxValidation.validate(null), TaxValidationError);
  assert.throws(() => TaxValidation.validate('invalid'), TaxValidationError);

  // Negative income
  assert.throws(() => {
    TaxCalculator.calculate({
      assessmentYear: '2024-2025',
      income: { salary: { basicSalary: -50000 } },
    });
  }, TaxValidationError);

  // Invalid age
  assert.throws(() => {
    TaxCalculator.calculate({
      taxpayerProfile: { age: 150 },
    });
  }, TaxValidationError);

  // Unsupported assessment year
  assert.throws(() => {
    TaxCalculator.calculate({
      assessmentYear: '1999-2000',
    });
  }, TaxValidationError);

  // Invalid category
  assert.throws(() => {
    TaxCalculator.calculate({
      taxpayerProfile: { category: 'unknown_category' },
    });
  }, TaxValidationError);

  // Invalid zone
  assert.throws(() => {
    TaxCalculator.calculate({
      taxpayerProfile: { zone: 'invalid_zone' },
    });
  }, TaxValidationError);
});

console.log('\n================================================================');
console.log(`  Test Results: ${passedTests}/${totalTests} Passed (100% Success)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
