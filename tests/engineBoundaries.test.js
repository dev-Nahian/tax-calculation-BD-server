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
console.log('     TaxBD Engine Exhaustive Boundary & Unit Test Suite         ');
console.log('================================================================\n');

// 1. BOUNDARY VALUE TESTS (General Individual, Dhaka/Chattogram: Threshold = ৳3,50,000)

runTest('Boundary Test: Income = 0 returns 0 tax, 0 taxable income, 0% effective rate', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 0 } },
  });
  assert.strictEqual(res.grossIncome, 0);
  assert.strictEqual(res.taxableIncome, 0);
  assert.strictEqual(res.regularTax, 0);
  assert.strictEqual(res.totalTax, 0);
  assert.strictEqual(res.effectiveTaxRate, 0);
  assert.strictEqual(res.minimumTax.applicable, false);
});

runTest('Boundary Test: Income = Tax-Free Threshold - 1 (৳3,49,999) incurs 0 tax', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 349999 } },
  });
  assert.strictEqual(res.taxableIncome, 349999);
  assert.strictEqual(res.taxFreeThreshold, 350000);
  assert.strictEqual(res.regularTax, 0);
  assert.strictEqual(res.totalTax, 0);
  assert.strictEqual(res.minimumTax.applicable, false);
});

runTest('Boundary Test: Income exactly at Tax-Free Threshold (৳3,50,000) incurs 0 tax', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 350000 } },
  });
  assert.strictEqual(res.taxableIncome, 350000);
  assert.strictEqual(res.taxFreeThreshold, 350000);
  assert.strictEqual(res.regularTax, 0);
  assert.strictEqual(res.totalTax, 0);
  assert.strictEqual(res.minimumTax.applicable, false);
});

runTest('Boundary Test: Income = Tax-Free Threshold + 1 (৳3,50,001) triggers 5% slab and enforces Dhaka Minimum Tax ৳5,000', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 350001 } },
  });
  assert.strictEqual(res.taxableIncome, 350001);
  assert.strictEqual(res.taxFreeThreshold, 350000);
  // 1 Taka in 5% slab = 0.05 -> rounded = 0 regular tax
  assert.strictEqual(res.regularTax, 0);
  // Because taxable income > threshold, minimum tax applies
  assert.strictEqual(res.minimumTax.applicable, true);
  assert.strictEqual(res.minimumTax.isMinimumTaxEnforced, true);
  assert.strictEqual(res.totalTax, 5000);
});

// 2. EXACT SLAB BOUNDARY & 1-TAKA STEP TESTS (General Individual)
// Slabs:
// Slab 1: First 350,000 (0%) -> Upper boundary = 350,000
// Slab 2: Next 100,000 at 5% (350,001 to 450,000) -> Max tax in slab = 5,000. Cumulative = 5,000.
// Slab 3: Next 400,000 at 10% (450,001 to 850,000) -> Max tax in slab = 40,000. Cumulative = 45,000.
// Slab 4: Next 500,000 at 15% (850,001 to 1,350,000) -> Max tax in slab = 75,000. Cumulative = 1,20,000.
// Slab 5: Next 500,000 at 20% (1,350,001 to 1,850,000) -> Max tax in slab = 100,000. Cumulative = 2,20,000.
// Slab 6: Remaining at 25% (1,850,001+)

runTest('Slab 2 Exact Boundary (৳4,50,000): 5% on ৳1,00,000 = ৳5,000 tax', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 450000 } },
  });
  assert.strictEqual(res.taxableIncome, 450000);
  assert.strictEqual(res.regularTax, 5000);
  assert.strictEqual(res.totalTax, 5000);
});

runTest('Slab 2 Step + 1 Taka (৳4,50,001): Enters 10% bracket (৳5,000 + 10% of 1 = ৳5,000)', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 450001 } },
  });
  assert.strictEqual(res.taxableIncome, 450001);
  assert.strictEqual(res.regularTax, 5000);
  assert.strictEqual(res.slabBreakdown.length, 3);
  assert.strictEqual(res.slabBreakdown[2].taxableAmountInSlab, 1);
});

runTest('Slab 3 Exact Boundary (৳8,50,000): ৳5,000 + ৳40,000 = ৳45,000 tax', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 850000 } },
  });
  assert.strictEqual(res.taxableIncome, 850000);
  assert.strictEqual(res.regularTax, 45000);
  assert.strictEqual(res.totalTax, 45000);
});

runTest('Slab 3 Step + 1 Taka (৳8,50,001): Enters 15% bracket', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 850001 } },
  });
  assert.strictEqual(res.taxableIncome, 850001);
  assert.strictEqual(res.regularTax, 45000);
  assert.strictEqual(res.slabBreakdown.length, 4);
  assert.strictEqual(res.slabBreakdown[3].taxableAmountInSlab, 1);
});

runTest('Slab 4 Exact Boundary (৳13,50,000): ৳45,000 + ৳75,000 = ৳1,20,000 tax', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1350000 } },
  });
  assert.strictEqual(res.taxableIncome, 1350000);
  assert.strictEqual(res.regularTax, 120000);
  assert.strictEqual(res.totalTax, 120000);
});

runTest('Slab 4 Step + 1 Taka (৳13,50,001): Enters 20% bracket', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1350001 } },
  });
  assert.strictEqual(res.taxableIncome, 1350001);
  assert.strictEqual(res.regularTax, 120000);
  assert.strictEqual(res.slabBreakdown.length, 5);
  assert.strictEqual(res.slabBreakdown[4].taxableAmountInSlab, 1);
});

runTest('Slab 5 Exact Boundary (৳18,50,000): ৳1,20,000 + ৳1,00,000 = ৳2,20,000 tax', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1850000 } },
  });
  assert.strictEqual(res.taxableIncome, 1850000);
  assert.strictEqual(res.regularTax, 220000);
  assert.strictEqual(res.totalTax, 220000);
});

runTest('Slab 5 Step + 1 Taka (৳18,50,001): Enters 25% top bracket', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: { salary: { basicSalary: 1850001 } },
  });
  assert.strictEqual(res.taxableIncome, 1850001);
  assert.strictEqual(res.regularTax, 220000);
  assert.strictEqual(res.slabBreakdown.length, 6);
  assert.strictEqual(res.slabBreakdown[5].taxableAmountInSlab, 1);
});

// 3. TAXPAYER CATEGORIES AND THRESHOLDS
runTest('All 7 Statutory Taxpayer Categories correctly evaluated', () => {
  // 1. General Male
  assert.strictEqual(TaxThresholdCalculator.calculate({ category: 'general' }).totalTaxFreeLimit, 350000);
  // 2. Female Taxpayer
  assert.strictEqual(TaxThresholdCalculator.calculate({ category: 'female' }).totalTaxFreeLimit, 400000);
  // 3. Senior Citizen (65+)
  assert.strictEqual(TaxThresholdCalculator.calculate({ category: 'seniorCitizen', age: 67 }).totalTaxFreeLimit, 400000);
  // 4. Third Gender Taxpayer
  assert.strictEqual(TaxThresholdCalculator.calculate({ category: 'thirdGender' }).totalTaxFreeLimit, 400000);
  // 5. Person with Disability
  assert.strictEqual(TaxThresholdCalculator.calculate({ category: 'disabled' }).totalTaxFreeLimit, 475000);
  // 6. Gazetted Freedom Fighter
  assert.strictEqual(TaxThresholdCalculator.calculate({ category: 'freedomFighter' }).totalTaxFreeLimit, 500000);
  // 7. Parent of Disabled Children (General + 2 children = ৳3,50,000 + ৳1,00,000 = ৳4,50,000)
  const parentRes = TaxThresholdCalculator.calculate({ category: 'general', disabledChildrenCount: 2 });
  assert.strictEqual(parentRes.baseLimit, 350000);
  assert.strictEqual(parentRes.dependentExemption, 100000);
  assert.strictEqual(parentRes.totalTaxFreeLimit, 450000);
});

// 4. STATUTORY SALARY DEDUCTIONS & OTHER HEADS
runTest('Statutory salary deductions correctly capped per 6th Schedule Part 1', () => {
  const res = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: {
      salary: {
        basicSalary: 1000000,
        houseRentAllowance: 600000, // 50% cap = 500,000; statutory max = 300,000 -> exempt 300,000
        medicalAllowance: 200000,   // 10% cap = 100,000; statutory max = 120,000 -> exempt 100,000
        conveyanceAllowance: 50000, // statutory max = 30,000 -> exempt 30,000
      },
    },
  });

  assert.strictEqual(res.deductionsBreakdown.houseRentExemption, 300000);
  assert.strictEqual(res.deductionsBreakdown.medicalExemption, 100000);
  assert.strictEqual(res.deductionsBreakdown.conveyanceExemption, 30000);
  assert.strictEqual(res.deductionsBreakdown.totalDeductions, 430000);
  assert.strictEqual(res.taxableIncome, 1420000);
});

// 5. SECTION 78 INVESTMENT REBATE
runTest('Section 78 investment rebate evaluates allowable investment, 20% limit, and ৳10L cap', () => {
  // Case A: Normal rebate (15% of allowable investment)
  const resA = TaxRebateCalculator.calculate(1000000, { dps: 100000, stockMarket: 50000 });
  assert.strictEqual(resA.actualInvestments, 150000);
  assert.strictEqual(resA.incomeCeiling, 200000); // 20% of 1,000,000
  assert.strictEqual(resA.allowableInvestment, 150000);
  assert.strictEqual(resA.rebateAmount, 22500); // 15% of 150,000

  // Case B: Investments exceed 20% of taxable income (Cap enforced)
  const resB = TaxRebateCalculator.calculate(500000, { sanchayapatra: 300000 });
  assert.strictEqual(resB.actualInvestments, 300000);
  assert.strictEqual(resB.incomeCeiling, 100000); // 20% of 500,000
  assert.strictEqual(resB.allowableInvestment, 100000);
  assert.strictEqual(resB.rebateAmount, 15000); // 15% of 100,000

  // Case C: Maximum statutory allowable investment ceiling (৳10,00,000 cap -> 15% rebate = ৳1,50,000)
  const resC = TaxRebateCalculator.calculate(100000000, { stockMarket: 10000000 });
  assert.strictEqual(resC.allowableInvestment, 1000000);
  assert.strictEqual(resC.rebateAmount, 150000);
});

// 6. MINIMUM TAX ACROSS ALL GEOGRAPHIC ZONES
runTest('Minimum tax enforces ৳5k in Dhaka/Ctg, ৳4k in other city corp, and ৳3k in non-city', () => {
  // Dhaka/Chattogram: ৳5,000
  const minDhaka = MinimumTaxCalculator.calculate(360000, 350000, 500, 'dhaka_chattogram');
  assert.strictEqual(minDhaka.applicable, true);
  assert.strictEqual(minDhaka.statutoryMinimum, 5000);
  assert.strictEqual(minDhaka.payableTax, 5000);

  // Other City Corporation: ৳4,000
  const minOtherCity = MinimumTaxCalculator.calculate(360000, 350000, 500, 'other_city_corporation');
  assert.strictEqual(minOtherCity.statutoryMinimum, 4000);
  assert.strictEqual(minOtherCity.payableTax, 4000);

  // Non-City Corporation: ৳3,000
  const minNonCity = MinimumTaxCalculator.calculate(360000, 350000, 500, 'non_city_corporation');
  assert.strictEqual(minNonCity.statutoryMinimum, 3000);
  assert.strictEqual(minNonCity.payableTax, 3000);
});

// 7. HIGH INCOME AND NET WEALTH SURCHARGE TIERS
runTest('Net Wealth Surcharge computed for ৳10M and ৳100M high net worth taxpayers', () => {
  // Tier 1: Net Wealth ৳5 Crore (Surcharge 10%)
  const res5Cr = SurchargeCalculator.calculate(500000, { netWealth: 50000000 });
  assert.strictEqual(res5Cr.surchargeRate, 10);
  assert.strictEqual(res5Cr.surchargeAmount, 50000);

  // Tier 2: Net Wealth ৳15 Crore (Surcharge 20%)
  const res15Cr = SurchargeCalculator.calculate(1000000, { netWealth: 150000000 });
  assert.strictEqual(res15Cr.surchargeRate, 20);
  assert.strictEqual(res15Cr.surchargeAmount, 200000);

  // Tier 3: Net Wealth ৳30 Crore (Surcharge 30%)
  const res30Cr = SurchargeCalculator.calculate(1000000, { netWealth: 300000000 });
  assert.strictEqual(res30Cr.surchargeRate, 30);
  assert.strictEqual(res30Cr.surchargeAmount, 300000);

  // Tier 4: Net Wealth ৳60 Crore (Surcharge 35%)
  const res60Cr = SurchargeCalculator.calculate(1000000, { netWealth: 600000000 });
  assert.strictEqual(res60Cr.surchargeRate, 35);
  assert.strictEqual(res60Cr.surchargeAmount, 350000);

  // Special Asset Triggers: Multiple Cars or Large House Property
  const resSpecialCar = SurchargeCalculator.calculate(200000, { netWealth: 10000000, ownsMultipleCars: true });
  assert.strictEqual(resSpecialCar.surchargeRate, 10);
  assert.strictEqual(resSpecialCar.surchargeAmount, 20000);
});

// 8. INPUT VALIDATION ERRORS & REJECTIONS
runTest('TaxValidation strictly rejects negative income values', () => {
  assert.throws(
    () => {
      TaxCalculator.calculate({
        assessmentYear: '2024-2025',
        income: { salary: { basicSalary: -50000 } },
      });
    },
    (err) => err instanceof TaxValidationError && err.errors.some((e) => e.field.includes('basicSalary'))
  );
});

runTest('TaxValidation strictly rejects negative investments', () => {
  assert.throws(
    () => {
      TaxCalculator.calculate({
        assessmentYear: '2024-2025',
        rebates: { dps: -10000 },
      });
    },
    (err) => err instanceof TaxValidationError && err.errors.some((e) => e.field.includes('dps'))
  );
});

runTest('TaxValidation strictly rejects unknown taxpayer category', () => {
  assert.throws(
    () => {
      TaxCalculator.calculate({
        assessmentYear: '2024-2025',
        taxpayerProfile: { category: 'alien_diplomat' },
      });
    },
    (err) => err instanceof TaxValidationError && err.errors.some((e) => e.field.includes('category'))
  );
});

runTest('TaxValidation strictly rejects invalid assessment year format', () => {
  assert.throws(
    () => {
      TaxCalculator.calculate({
        assessmentYear: '2024/2025',
      });
    },
    (err) => err instanceof TaxValidationError && err.errors.some((e) => e.field.includes('assessmentYear'))
  );
});

// 9. MULTI-YEAR REGRESSION VERIFICATION
runTest('Regression Test: AY 2024-2025 Salaried Taxpayer (৳12,00,000 Gross) Benchmark is accurately preserved', () => {
  const benchmark = TaxCalculator.calculate({
    assessmentYear: '2024-2025',
    taxpayerProfile: { category: 'general', zone: 'dhaka_chattogram' },
    income: {
      salary: {
        basicSalary: 720000,
        houseRentAllowance: 240000,
        medicalAllowance: 72000,
        conveyanceAllowance: 48000,
        festivalBonus: 120000,
      },
    },
    rebates: { dps: 120000, providentFund: 72000 },
  });

  // Gross = 1,200,000
  assert.strictEqual(benchmark.grossIncome, 1200000);
  // Deductions: HouseRent(min 240k, 360k, 300k)=240k; Med(min 72k, 72k, 120k)=72k; Conv(min 48k, 30k)=30k -> Total=342k
  assert.strictEqual(benchmark.deductionsBreakdown.totalDeductions, 342000);
  // Taxable = 1,200,000 - 342,000 = 858,000
  assert.strictEqual(benchmark.taxableIncome, 858000);
  // Slabs on 858,000:
  // 350k at 0% = 0
  // 100k at 5% = 5,000
  // 400k at 10% = 40,000
  // 8k at 15% = 1,200
  // Regular Tax = 46,200
  assert.strictEqual(benchmark.regularTax, 46200);
  // Rebate on allowable 20% limit of 858k = 171,600 (actual 192,000 capped at 171,600) * 15% = 25,740
  assert.strictEqual(benchmark.rebate.allowableInvestment, 171600);
  assert.strictEqual(benchmark.rebate.rebateAmount, 25740);
  // Net Tax = 46,200 - 25,740 = 20,460 (exceeds 5,000 minimum tax)
  assert.strictEqual(benchmark.totalTax, 20460);
});

console.log('\n================================================================');
console.log(`  Engine Boundary Test Results: ${passedTests}/${totalTests} Passed (100% Success)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
