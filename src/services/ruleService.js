import {
  TaxSource,
  TaxYear,
  TaxSlab,
  TaxpayerCategory,
  TaxThreshold,
  TaxRebateRule,
  IncomeCategory,
  DeductionRule,
  MinimumTaxRule,
  SurchargeRule,
} from '../models/index.js';

// Fallback in-memory official data if MongoDB is offline during local dev
const fallbackTaxSources = [
  {
    _id: '64f1a2b3c4d5e6f7a8b9c0d1',
    title: 'Income Tax Act 2023 (Act No. 12 of 2023 / আয়কর আইন, ২০২৩)',
    sourceType: 'NBR_ACT',
    authority: 'National Board of Revenue (NBR), Bangladesh',
    assessmentYear: '2023-2024',
    referenceNumber: 'ACT-12-2023',
    sourceUrl: 'https://nbr.gov.bd/rules/acts/income-tax-act',
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c0d2',
    title: 'Finance Act 2024 (অর্থ আইন, ২০২৪)',
    sourceType: 'NBR_ACT',
    authority: 'Parliament of Bangladesh & NBR',
    assessmentYear: '2024-2025',
    referenceNumber: 'ACT-18-2024',
    sourceUrl: 'https://nbr.gov.bd/rules/acts/finance-act-2024',
  },
];

import mongoose from 'mongoose';

export const getAllTaxYears = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const years = await TaxYear.find({}).sort({ assessmentYear: -1 });
      if (years && years.length > 0) return years;
    } catch (err) {}
  }

  return [
    { assessmentYear: '2024-2025', incomeYear: '2023-2024', title: 'AY 2024-2025 (Active)', status: 'active' },
    { assessmentYear: '2025-2026', incomeYear: '2024-2025', title: 'AY 2025-2026 (Upcoming)', status: 'upcoming' },
    { assessmentYear: '2023-2024', incomeYear: '2022-2023', title: 'AY 2023-2024 (Archived)', status: 'archived' },
  ];
};

export const getCompleteRulePackage = async (assessmentYear = '2024-2025') => {
  if (mongoose.connection.readyState === 1) {
    try {
      const taxYear = await TaxYear.findOne({ assessmentYear });
      if (taxYear) {
        const taxYearId = taxYear._id;

        const [slabs, thresholds, categories, incomeCategories, deductions, rebates, minimumTaxes, surcharges, sources] =
          await Promise.all([
            TaxSlab.find({ taxYearId }).populate('sourceId').sort({ sequence: 1 }),
            TaxThreshold.find({ taxYearId }).populate('sourceId'),
            TaxpayerCategory.find({ active: true }).populate('sourceId'),
            IncomeCategory.find({ active: true }).populate('sourceId'),
            DeductionRule.find({ taxYearId }).populate('sourceId'),
            TaxRebateRule.find({ taxYearId }).populate('sourceId'),
            MinimumTaxRule.find({ taxYearId }).populate('sourceId'),
            SurchargeRule.find({ taxYearId }).populate('sourceId').sort({ lowerNetWealth: 1 }),
            TaxSource.find({ active: true }),
          ]);

        return {
          taxYear,
          slabs,
          thresholds,
          categories,
          incomeCategories,
          deductions,
          rebates,
          minimumTaxes,
          surcharges,
          sources,
        };
      }
    } catch (err) {}
  }

  // Resilient fallback structure
  return {
    taxYear: { assessmentYear, incomeYear: '2023-2024', status: 'active', officialSource: 'Finance Act 2024 & NBR Paripatra' },
    slabs: [
      { sequence: 1, lowerLimit: 0, upperLimit: 350000, rate: 0, description: 'First ৳3,50,000 (Tax Free)', sourceId: fallbackTaxSources[1] },
      { sequence: 2, lowerLimit: 350000, upperLimit: 450000, rate: 5, description: 'Next ৳1,00,000 at 5%', sourceId: fallbackTaxSources[1] },
      { sequence: 3, lowerLimit: 450000, upperLimit: 850000, rate: 10, description: 'Next ৳4,00,000 at 10%', sourceId: fallbackTaxSources[1] },
      { sequence: 4, lowerLimit: 850000, upperLimit: 1350000, rate: 15, description: 'Next ৳5,00,000 at 15%', sourceId: fallbackTaxSources[1] },
      { sequence: 5, lowerLimit: 1350000, upperLimit: 1850000, rate: 20, description: 'Next ৳5,00,000 at 20%', sourceId: fallbackTaxSources[1] },
      { sequence: 6, lowerLimit: 1850000, upperLimit: null, rate: 25, description: 'Remaining Balance at 25%', sourceId: fallbackTaxSources[1] },
    ],
    thresholds: [
      { taxpayerCategory: 'general', taxFreeLimit: 350000, sourceId: fallbackTaxSources[1] },
      { taxpayerCategory: 'female', taxFreeLimit: 400000, sourceId: fallbackTaxSources[1] },
      { taxpayerCategory: 'seniorCitizen', taxFreeLimit: 400000, sourceId: fallbackTaxSources[1] },
      { taxpayerCategory: 'disabled', taxFreeLimit: 475000, sourceId: fallbackTaxSources[1] },
      { taxpayerCategory: 'freedomFighter', taxFreeLimit: 500000, sourceId: fallbackTaxSources[1] },
    ],
    deductions: [
      { incomeCategory: 'salary', deductionType: 'house_rent_exemption', maxPercentage: 50, maxCap: 300000, sourceId: fallbackTaxSources[1] },
      { incomeCategory: 'salary', deductionType: 'medical_allowance_exemption', maxPercentage: 10, maxCap: 120000, sourceId: fallbackTaxSources[1] },
      { incomeCategory: 'salary', deductionType: 'conveyance_allowance_exemption', maxCap: 30000, sourceId: fallbackTaxSources[1] },
    ],
    rebates: [
      { category: 'section78_investment', percentage: 15, maximumAmount: 1000000, maxInvestmentPercentageOfIncome: 20, sourceId: fallbackTaxSources[1] },
    ],
    minimumTaxes: [
      { zone: 'dhaka_chattogram', amount: 5000, sourceId: fallbackTaxSources[1] },
      { zone: 'other_city_corporation', amount: 4000, sourceId: fallbackTaxSources[1] },
      { zone: 'non_city_corporation', amount: 3000, sourceId: fallbackTaxSources[1] },
    ],
    surcharges: [
      { lowerNetWealth: 0, upperNetWealth: 40000000, surchargeRate: 0, sourceId: fallbackTaxSources[1] },
      { lowerNetWealth: 40000000, upperNetWealth: 100000000, surchargeRate: 10, sourceId: fallbackTaxSources[1] },
      { lowerNetWealth: 100000000, upperNetWealth: 200000000, surchargeRate: 20, sourceId: fallbackTaxSources[1] },
    ],
    sources: fallbackTaxSources,
  };
};

export const getAllSources = async () => {
  try {
    const sources = await TaxSource.find({ active: true }).sort({ publicationDate: -1 });
    if (sources && sources.length > 0) return sources;
  } catch (err) {}
  return fallbackTaxSources;
};

export const getTaxpayerCategories = async () => {
  try {
    const categories = await TaxpayerCategory.find({ active: true }).populate('sourceId');
    if (categories && categories.length > 0) return categories;
  } catch (err) {}
  return [
    { key: 'general', name: 'General Individual' },
    { key: 'female', name: 'Female Taxpayer' },
    { key: 'seniorCitizen', name: 'Senior Citizen (65+)' },
    { key: 'thirdGender', name: 'Third Gender' },
    { key: 'disabled', name: 'Person with Disability' },
    { key: 'freedomFighter', name: 'Gazetted Freedom Fighter' },
  ];
};

export const getIncomeCategories = async () => {
  try {
    const heads = await IncomeCategory.find({ active: true }).populate('sourceId');
    if (heads && heads.length > 0) return heads;
  } catch (err) {}
  return [
    { key: 'salary', name: 'Income from Employment (Salary)', sectionReference: 'Section 32' },
    { key: 'houseProperty', name: 'Income from House Property (Rent)', sectionReference: 'Section 36' },
    { key: 'agriculture', name: 'Income from Agriculture', sectionReference: 'Section 40' },
    { key: 'business', name: 'Income from Business', sectionReference: 'Section 45' },
    { key: 'capitalGain', name: 'Capital Gains', sectionReference: 'Section 57' },
    { key: 'financialAssets', name: 'Income from Financial Assets', sectionReference: 'Section 62' },
    { key: 'otherSources', name: 'Income from Other Sources', sectionReference: 'Section 66' },
  ];
};

export const getRulesByYear = async (year = '2024-2025') => {
  return await getCompleteRulePackage(year);
};

export const getAllRules = async () => {
  const years = await getAllTaxYears();
  const packages = await Promise.all(years.map((y) => getCompleteRulePackage(y.assessmentYear)));
  return packages;
};
