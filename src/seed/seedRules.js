import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TaxRule from '../models/TaxRule.js';

dotenv.config();

export const defaultRulesData = [
  {
    assessmentYear: '2024-2025',
    title: 'Bangladesh Income Tax Rules AY 2024-2025 (Income Tax Act 2023)',
    effectiveFrom: new Date('2024-07-01'),
    effectiveTo: new Date('2025-06-30'),
    isCurrent: true,
    exemptionThresholds: {
      general: 350000,
      female: 400000,
      senior: 400000, // Age 65+
      disabled: 475000,
      gazettedFreedomFighter: 500000,
      parentOfDisabledChildExtra: 50000,
    },
    slabs: [
      { slabLimit: 0, rate: 0, description: 'First slab (Exemption limit based on category)' },
      { slabLimit: 100000, rate: 5, description: 'Next ৳1,00,000 at 5%' },
      { slabLimit: 400000, rate: 10, description: 'Next ৳4,00,000 at 10%' },
      { slabLimit: 500000, rate: 15, description: 'Next ৳5,00,000 at 15%' },
      { slabLimit: 500000, rate: 20, description: 'Next ৳5,00,000 at 20%' },
      { slabLimit: 0, rate: 25, description: 'Remaining balance at 25%' },
    ],
    minimumTax: {
      dhaka_chattogram: 5000,
      other_city_corporation: 4000,
      non_city_corporation: 3000,
    },
    investmentRebate: {
      rebateRate: 15,
      maxInvestmentPercentageOfTotalIncome: 20,
      maxAllowableInvestmentCap: 1000000,
    },
    houseRentExemption: {
      maxPercentageOfBasicSalary: 50,
      maxMonthlyCap: 25000,
    },
    medicalAllowanceExemption: {
      maxPercentageOfBasicSalary: 10,
      maxYearlyCap: 120000,
    },
    conveyanceExemption: {
      maxYearlyCap: 30000,
    },
    notes: [
      'Under the Income Tax Act 2023, standard tax rates apply across all resident individuals.',
      'Surcharge applies if individual net wealth exceeds BDT 4 Crore.',
      'Minimum tax is applicable if the taxable income exceeds the initial exemption limit.',
      'Tax Day deadline for individual return submission is November 30 (or extended by NBR).',
    ],
  },
  {
    assessmentYear: '2025-2026',
    title: 'Bangladesh Income Tax Rules AY 2025-2026 (Finance Act Framework)',
    effectiveFrom: new Date('2025-07-01'),
    effectiveTo: new Date('2026-06-30'),
    isCurrent: false,
    exemptionThresholds: {
      general: 375000,
      female: 425000,
      senior: 425000,
      disabled: 500000,
      gazettedFreedomFighter: 525000,
      parentOfDisabledChildExtra: 50000,
    },
    slabs: [
      { slabLimit: 0, rate: 0, description: 'First slab (Exemption limit)' },
      { slabLimit: 100000, rate: 5, description: 'Next ৳1,00,000 at 5%' },
      { slabLimit: 400000, rate: 10, description: 'Next ৳4,00,000 at 10%' },
      { slabLimit: 500000, rate: 15, description: 'Next ৳5,00,000 at 15%' },
      { slabLimit: 500000, rate: 20, description: 'Next ৳5,00,000 at 20%' },
      { slabLimit: 0, rate: 25, description: 'Remaining balance at 25%' },
    ],
    minimumTax: {
      dhaka_chattogram: 5000,
      other_city_corporation: 4000,
      non_city_corporation: 3000,
    },
    investmentRebate: {
      rebateRate: 15,
      maxInvestmentPercentageOfTotalIncome: 20,
      maxAllowableInvestmentCap: 1000000,
    },
    houseRentExemption: {
      maxPercentageOfBasicSalary: 50,
      maxMonthlyCap: 25000,
    },
    medicalAllowanceExemption: {
      maxPercentageOfBasicSalary: 10,
      maxYearlyCap: 120000,
    },
    conveyanceExemption: {
      maxYearlyCap: 30000,
    },
    notes: [
      'Provisional framework based on NBR guidelines and Finance Act updates.',
      'Mandatory proof of submission of tax return required for 43+ public services.',
    ],
  },
];

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taxbd';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('[Seed] Connected to MongoDB...');

    await TaxRule.deleteMany({});
    await TaxRule.insertMany(defaultRulesData);
    console.log('[Seed] Successfully seeded tax rules!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error.message);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seedRules.js')) {
  seedDatabase();
}
