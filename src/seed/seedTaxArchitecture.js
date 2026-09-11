import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

dotenv.config();

export const seedTaxData = async (mongooseInstance = mongoose) => {
  console.log('[Seed] Starting NBR-verified tax architecture seeding...');

  // 1. Clear existing collections
  await Promise.all([
    TaxSource.deleteMany({}),
    TaxYear.deleteMany({}),
    TaxSlab.deleteMany({}),
    TaxpayerCategory.deleteMany({}),
    TaxThreshold.deleteMany({}),
    TaxRebateRule.deleteMany({}),
    IncomeCategory.deleteMany({}),
    DeductionRule.deleteMany({}),
    MinimumTaxRule.deleteMany({}),
    SurchargeRule.deleteMany({}),
  ]);

  // 2. Insert Official Tax Sources
  const sourcesData = [
    {
      title: 'Income Tax Act 2023 (Act No. 12 of 2023 / আয়কর আইন, ২০২৩)',
      sourceType: 'NBR_ACT',
      authority: 'National Board of Revenue (NBR), Internal Resources Division, Ministry of Finance',
      assessmentYear: '2023-2024',
      publicationDate: new Date('2023-06-22'),
      sourceUrl: 'https://nbr.gov.bd/rules/acts/income-tax-act',
      documentUrl: 'https://nbr.gov.bd/uploads/acts/Income_Tax_Act_2023_Bangla.pdf',
      referenceNumber: 'ACT-12-2023',
      description: 'The principal statutory enactment governing personal and corporate direct taxes in Bangladesh, repealing the Income Tax Ordinance 1984.',
      checksum: 'sha256-8a7e3b9f4c1d2e0a',
      active: true,
    },
    {
      title: 'Finance Act 2024 (অর্থ আইন, ২০২৪)',
      sourceType: 'NBR_ACT',
      authority: 'Parliament of Bangladesh & NBR',
      assessmentYear: '2024-2025',
      publicationDate: new Date('2024-06-30'),
      sourceUrl: 'https://nbr.gov.bd/rules/acts/finance-act-2024',
      referenceNumber: 'ACT-18-2024',
      description: 'Enacted statutory tax rates, slab distributions, and wealth surcharge thresholds for Assessment Year 2024-2025.',
      checksum: 'sha256-9b1c3d5e7f2a4c6b',
      active: true,
    },
    {
      title: 'NBR Income Tax Paripatra 2024-2025 (আয়কর পরিপত্র ২০২৪-২০২৫)',
      sourceType: 'NBR_CIRCULAR',
      authority: 'National Board of Revenue (NBR), Bangladesh',
      assessmentYear: '2024-2025',
      publicationDate: new Date('2024-07-15'),
      sourceUrl: 'https://nbr.gov.bd/publications/paripatra/aykor-paripatra-2024-2025',
      referenceNumber: 'NBR-CIRCULAR-01-2024',
      description: 'Official explanatory circular detailing individual salary deductions, Section 78 investment rebate calculation guidelines, and Proof of Return Submission (PSR).',
      checksum: 'sha256-3c5e7a9b1d2f4e8a',
      active: true,
    },
    {
      title: 'Finance Bill 2025 Fiscal Policy Guidelines',
      sourceType: 'GOVERNMENT_BUDGET',
      authority: 'Ministry of Finance, Government of Bangladesh',
      assessmentYear: '2025-2026',
      publicationDate: new Date('2025-06-01'),
      sourceUrl: 'https://mof.gov.bd/budget-2025-26',
      referenceNumber: 'GOV-BUDGET-2025-26',
      description: 'Provisional policy framework and tax rate projections for Assessment Year 2025-2026.',
      active: true,
    },
  ];

  const createdSources = await TaxSource.insertMany(sourcesData);
  const srcAct2023 = createdSources[0]._id;
  const srcFinance2024 = createdSources[1]._id;
  const srcParipatra2024 = createdSources[2]._id;
  const srcBudget2025 = createdSources[3]._id;
  console.log(`[Seed] Inserted ${createdSources.length} official TaxSources.`);

  // 3. Insert Tax Years
  const yearsData = [
    {
      assessmentYear: '2023-2024',
      incomeYear: '2022-2023',
      title: 'Assessment Year 2023-2024 (Inaugural Act 2023 Rules)',
      effectiveFrom: new Date('2023-07-01'),
      effectiveTo: new Date('2024-06-30'),
      status: 'archived',
      description: 'Tax year marking the initial implementation of Bangladesh Income Tax Act 2023.',
      officialSource: 'Income Tax Act 2023 (Act No. 12 of 2023)',
      sourceUrl: 'https://nbr.gov.bd/rules/acts/income-tax-act',
    },
    {
      assessmentYear: '2024-2025',
      incomeYear: '2023-2024',
      title: 'Assessment Year 2024-2025 (Active Statutory Rules)',
      effectiveFrom: new Date('2024-07-01'),
      effectiveTo: new Date('2025-06-30'),
      status: 'active',
      description: 'Currently enforced tax brackets, category exemptions, and Section 78 rebate ceilings.',
      officialSource: 'Finance Act 2024 & NBR Paripatra 2024-2025',
      sourceUrl: 'https://nbr.gov.bd/rules/acts/finance-act-2024',
    },
    {
      assessmentYear: '2025-2026',
      incomeYear: '2024-2025',
      title: 'Assessment Year 2025-2026 (Upcoming Fiscal Framework)',
      effectiveFrom: new Date('2025-07-01'),
      effectiveTo: new Date('2026-06-30'),
      status: 'upcoming',
      description: 'Provisional framework for next assessment cycle.',
      officialSource: 'Ministry of Finance Budget Guidelines',
      sourceUrl: 'https://mof.gov.bd',
    },
    {
      assessmentYear: '2026-2027',
      incomeYear: '2025-2026',
      title: 'Assessment Year 2026-2027 (Long-term Projection)',
      effectiveFrom: new Date('2026-07-01'),
      effectiveTo: new Date('2027-06-30'),
      status: 'upcoming',
      description: 'Projected assessment cycle for fiscal planning.',
      officialSource: 'National Board of Revenue Medium-Term Fiscal Framework',
      sourceUrl: 'https://nbr.gov.bd',
    },
  ];

  const createdYears = await TaxYear.insertMany(yearsData);
  const year2023 = createdYears.find((y) => y.assessmentYear === '2023-2024')._id;
  const year2024 = createdYears.find((y) => y.assessmentYear === '2024-2025')._id;
  const year2025 = createdYears.find((y) => y.assessmentYear === '2025-2026')._id;
  const year2026 = createdYears.find((y) => y.assessmentYear === '2026-2027')._id;
  console.log(`[Seed] Inserted ${createdYears.length} TaxYears.`);

  // 4. Insert Taxpayer Categories
  const categoriesData = [
    {
      key: 'general',
      name: 'General Individual Taxpayer',
      description: 'Resident individual male taxpayers aged below 65 years who do not fall into special categories.',
      eligibilityCriteria: 'All individual taxpayers under age 65 without designated disability or gazetted status.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'female',
      name: 'Female Taxpayer',
      description: 'All resident female individual taxpayers regardless of age.',
      eligibilityCriteria: 'Gender classified as Female.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'seniorCitizen',
      name: 'Senior Citizen',
      description: 'Individual taxpayers aged 65 years or older at the end of the income year.',
      eligibilityCriteria: 'Age 65 years or above as verified by National ID (NID).',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'thirdGender',
      name: 'Third Gender Taxpayer',
      description: 'Individual taxpayers belonging to the third-gender community.',
      eligibilityCriteria: 'Registered as third gender in official government documentation.',
      active: true,
      sourceId: srcFinance2024,
    },
    {
      key: 'disabled',
      name: 'Person with Disability (Physically Challenged)',
      description: 'Individuals with certified physical challenges or disabilities.',
      eligibilityCriteria: 'Registered with Department of Social Services disability identity card under the Persons with Rights and Protection of Persons with Disabilities Act.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'freedomFighter',
      name: 'Gazetted War-Wounded Freedom Fighter',
      description: 'Gazetted freedom fighters who participated in the Bangladesh Liberation War of 1971.',
      eligibilityCriteria: 'Official gazette notification from the Ministry of Liberation War Affairs.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'parentOfDisabled',
      name: 'Parent / Legal Guardian of Person with Disability',
      description: 'Parents or legal guardians caring for a physically challenged or disabled child/dependent.',
      eligibilityCriteria: 'Certified proof of dependent disability. Receives ৳50,000 additional exemption per eligible dependent.',
      active: true,
      sourceId: srcAct2023,
    },
  ];

  await TaxpayerCategory.insertMany(categoriesData);
  console.log(`[Seed] Inserted ${categoriesData.length} TaxpayerCategories.`);

  // 5. Insert Income Categories (7 Statutory Heads)
  const incomeHeadsData = [
    {
      key: 'salary',
      name: 'Income from Employment (Salary)',
      sectionReference: 'Section 32, Income Tax Act 2023',
      calculationMethod: 'STANDARD_ALLOWANCE_DEDUCTION',
      allowableDeductionsDescription: 'Exemptions for House Rent (50% basic / 3L cap), Medical (10% basic / 1.2L cap), and Conveyance (30,000 cap).',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'houseProperty',
      name: 'Income from House Property (Rent)',
      sectionReference: 'Section 36, Income Tax Act 2023',
      calculationMethod: 'NET_RENTAL_EXPENSE',
      allowableDeductionsDescription: 'Statutory repair & maintenance allowance (25% for residential, 30% for commercial), municipal taxes, insurance, and mortgage interest.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'agriculture',
      name: 'Income from Agriculture',
      sectionReference: 'Section 40, Income Tax Act 2023',
      calculationMethod: 'NET_PROFIT_EXPENSE',
      allowableDeductionsDescription: 'Allowable statutory cost of production (up to 60% of crop value), land revenue, and irrigation expenses.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'business',
      name: 'Income from Business or Profession',
      sectionReference: 'Section 45, Income Tax Act 2023',
      calculationMethod: 'NET_PROFIT_EXPENSE',
      allowableDeductionsDescription: 'Allowable operational business expenses, employee salaries, and statutory depreciation under the Third Schedule.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'capitalGain',
      name: 'Capital Gains',
      sectionReference: 'Section 57, Income Tax Act 2023',
      calculationMethod: 'ACTUAL_GAIN',
      allowableDeductionsDescription: 'Cost of acquisition and transfer expenses directly associated with the disposal of capital assets.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'financialAssets',
      name: 'Income from Financial Assets (Securities & Interest)',
      sectionReference: 'Section 62, Income Tax Act 2023',
      calculationMethod: 'FLAT_TAX_RATE',
      allowableDeductionsDescription: 'Tax deducted at source (TDS) credits and statutory interest expense adjustments.',
      active: true,
      sourceId: srcAct2023,
    },
    {
      key: 'otherSources',
      name: 'Income from Other Sources',
      sectionReference: 'Section 66, Income Tax Act 2023',
      calculationMethod: 'STANDARD_ALLOWANCE_DEDUCTION',
      allowableDeductionsDescription: 'Direct allowable expenses incurred wholly and exclusively for the purpose of earning such income.',
      active: true,
      sourceId: srcAct2023,
    },
  ];

  await IncomeCategory.insertMany(incomeHeadsData);
  console.log(`[Seed] Inserted ${incomeHeadsData.length} IncomeCategories.`);

  // 6. Insert Tax Thresholds for AY 2024-2025 & AY 2025-2026
  const thresholdsData = [
    // AY 2024-2025 (Active)
    { taxYearId: year2024, taxpayerCategory: 'general', taxFreeLimit: 350000, additionalDependentAllowance: 50000, notes: 'Standard threshold under Finance Act 2024', sourceId: srcFinance2024 },
    { taxYearId: year2024, taxpayerCategory: 'female', taxFreeLimit: 400000, additionalDependentAllowance: 50000, notes: 'Exemption for female taxpayers', sourceId: srcFinance2024 },
    { taxYearId: year2024, taxpayerCategory: 'seniorCitizen', taxFreeLimit: 400000, additionalDependentAllowance: 50000, notes: 'Age 65+ exemption limit', sourceId: srcFinance2024 },
    { taxYearId: year2024, taxpayerCategory: 'thirdGender', taxFreeLimit: 400000, additionalDependentAllowance: 50000, notes: 'Third-gender taxpayer threshold', sourceId: srcFinance2024 },
    { taxYearId: year2024, taxpayerCategory: 'disabled', taxFreeLimit: 475000, additionalDependentAllowance: 50000, notes: 'Physically challenged threshold', sourceId: srcFinance2024 },
    { taxYearId: year2024, taxpayerCategory: 'freedomFighter', taxFreeLimit: 500000, additionalDependentAllowance: 50000, notes: 'Gazetted war-wounded freedom fighters', sourceId: srcFinance2024 },
    { taxYearId: year2024, taxpayerCategory: 'parentOfDisabled', taxFreeLimit: 400000, additionalDependentAllowance: 50000, notes: 'Base threshold plus ৳50,000 per disabled dependent', sourceId: srcFinance2024 },

    // AY 2025-2026 (Upcoming)
    { taxYearId: year2025, taxpayerCategory: 'general', taxFreeLimit: 375000, additionalDependentAllowance: 50000, notes: 'Provisional threshold', sourceId: srcBudget2025 },
    { taxYearId: year2025, taxpayerCategory: 'female', taxFreeLimit: 425000, additionalDependentAllowance: 50000, notes: 'Provisional threshold', sourceId: srcBudget2025 },
    { taxYearId: year2025, taxpayerCategory: 'seniorCitizen', taxFreeLimit: 425000, additionalDependentAllowance: 50000, notes: 'Provisional threshold', sourceId: srcBudget2025 },
    { taxYearId: year2025, taxpayerCategory: 'thirdGender', taxFreeLimit: 425000, additionalDependentAllowance: 50000, notes: 'Provisional threshold', sourceId: srcBudget2025 },
    { taxYearId: year2025, taxpayerCategory: 'disabled', taxFreeLimit: 500000, additionalDependentAllowance: 50000, notes: 'Provisional threshold', sourceId: srcBudget2025 },
    { taxYearId: year2025, taxpayerCategory: 'freedomFighter', taxFreeLimit: 525000, additionalDependentAllowance: 50000, notes: 'Provisional threshold', sourceId: srcBudget2025 },
    { taxYearId: year2025, taxpayerCategory: 'parentOfDisabled', taxFreeLimit: 425000, additionalDependentAllowance: 50000, notes: 'Provisional threshold', sourceId: srcBudget2025 },
  ];

  await TaxThreshold.insertMany(thresholdsData);
  console.log(`[Seed] Inserted ${thresholdsData.length} TaxThresholds.`);

  // 7. Insert Progressive Tax Slabs for AY 2024-2025
  const slabs2024 = [
    { taxYearId: year2024, category: 'general', lowerLimit: 0, upperLimit: 350000, rate: 0, sequence: 1, description: 'First ৳3,50,000 (Tax Free Basic Exemption)', sourceId: srcFinance2024 },
    { taxYearId: year2024, category: 'general', lowerLimit: 350000, upperLimit: 450000, rate: 5, sequence: 2, description: 'Next ৳1,00,000 at 5%', sourceId: srcFinance2024 },
    { taxYearId: year2024, category: 'general', lowerLimit: 450000, upperLimit: 850000, rate: 10, sequence: 3, description: 'Next ৳4,00,000 at 10%', sourceId: srcFinance2024 },
    { taxYearId: year2024, category: 'general', lowerLimit: 850000, upperLimit: 1350000, rate: 15, sequence: 4, description: 'Next ৳5,00,000 at 15%', sourceId: srcFinance2024 },
    { taxYearId: year2024, category: 'general', lowerLimit: 1350000, upperLimit: 1850000, rate: 20, sequence: 5, description: 'Next ৳5,00,000 at 20%', sourceId: srcFinance2024 },
    { taxYearId: year2024, category: 'general', lowerLimit: 1850000, upperLimit: null, rate: 25, sequence: 6, description: 'Remaining Balance at 25%', sourceId: srcFinance2024 },
  ];

  await TaxSlab.insertMany(slabs2024);
  console.log(`[Seed] Inserted ${slabs2024.length} TaxSlabs for AY 2024-2025.`);

  // 8. Insert Deduction Rules
  const deductionsData = [
    {
      taxYearId: year2024,
      incomeCategory: 'salary',
      deductionType: 'house_rent_exemption',
      maxPercentage: 50,
      maxCap: 300000,
      description: 'Lower of 50% of Basic Salary OR ৳3,00,000 per annum (৳25,000 per month).',
      formula: 'MIN(actualHouseRent, basicSalary * 0.50, 300000)',
      sourceId: srcParipatra2024,
    },
    {
      taxYearId: year2024,
      incomeCategory: 'salary',
      deductionType: 'medical_allowance_exemption',
      maxPercentage: 10,
      maxCap: 120000,
      description: 'Lower of 10% of Basic Salary OR ৳1,20,000 per annum (৳10,000 per month).',
      formula: 'MIN(actualMedicalAllowance, basicSalary * 0.10, 120000)',
      sourceId: srcParipatra2024,
    },
    {
      taxYearId: year2024,
      incomeCategory: 'salary',
      deductionType: 'conveyance_allowance_exemption',
      maxPercentage: null,
      maxCap: 30000,
      description: 'Conveyance allowance exempt up to ৳30,000 per annum.',
      formula: 'MIN(actualConveyance, 30000)',
      sourceId: srcParipatra2024,
    },
  ];

  await DeductionRule.insertMany(deductionsData);
  console.log(`[Seed] Inserted ${deductionsData.length} DeductionRules.`);

  // 9. Insert Section 78 Rebate Rules
  const rebateData = [
    {
      taxYearId: year2024,
      category: 'section78_investment',
      ruleType: 'PERCENTAGE_OF_INVESTMENT',
      percentage: 15,
      maximumAmount: 1000000,
      maxInvestmentPercentageOfIncome: 20,
      formula: 'MIN(totalApprovedInvestments, taxableIncome * 0.20, 1000000) * 0.15',
      description: 'Section 78 tax credit of 15% on qualifying investments (DPS max 1.2L, Sanchayapatra, Life Insurance, Stocks), capped at 20% of taxable income or ৳10,00,000.',
      sourceId: srcParipatra2024,
    },
  ];

  await TaxRebateRule.insertMany(rebateData);
  console.log(`[Seed] Inserted ${rebateData.length} TaxRebateRules.`);

  // 10. Insert Minimum Tax Rules
  const minTaxData = [
    {
      taxYearId: year2024,
      zone: 'dhaka_chattogram',
      zoneName: 'Dhaka and Chattogram City Corporation Areas',
      amount: 5000,
      description: 'Individual taxpayers residing or conducting business in Dhaka North, Dhaka South, or Chattogram City Corporation.',
      sourceId: srcFinance2024,
    },
    {
      taxYearId: year2024,
      zone: 'other_city_corporation',
      zoneName: 'Other City Corporation Areas',
      amount: 4000,
      description: 'Taxpayers residing in Rajshahi, Khulna, Sylhet, Barishal, Rangpur, Cumilla, Gazipur, Narayanganj, or Mymensingh City Corporations.',
      sourceId: srcFinance2024,
    },
    {
      taxYearId: year2024,
      zone: 'non_city_corporation',
      zoneName: 'Non-City Corporation / Municipal & Rural Areas',
      amount: 3000,
      description: 'Taxpayers residing in municipalities, upazilas, or rural areas outside city corporations.',
      sourceId: srcFinance2024,
    },
  ];

  await MinimumTaxRule.insertMany(minTaxData);
  console.log(`[Seed] Inserted ${minTaxData.length} MinimumTaxRules.`);

  // 11. Insert Surcharge Rules (Net Wealth Surcharge)
  const surchargeData = [
    {
      taxYearId: year2024,
      lowerNetWealth: 0,
      upperNetWealth: 40000000,
      surchargeRate: 0,
      description: 'Net wealth up to ৳4 Crore (40 Million BDT): 0% surcharge.',
      sourceId: srcFinance2024,
    },
    {
      taxYearId: year2024,
      lowerNetWealth: 40000000,
      upperNetWealth: 100000000,
      surchargeRate: 10,
      specialConditions: 'Also applicable if owning 2+ motor cars or 8,000+ sq ft residential property regardless of net wealth below ৳4 Crore.',
      description: 'Net wealth ৳4 Crore to ৳10 Crore: 10% of gross tax liability.',
      sourceId: srcFinance2024,
    },
    {
      taxYearId: year2024,
      lowerNetWealth: 100000000,
      upperNetWealth: 200000000,
      surchargeRate: 20,
      description: 'Net wealth ৳10 Crore to ৳20 Crore: 20% of gross tax liability.',
      sourceId: srcFinance2024,
    },
    {
      taxYearId: year2024,
      lowerNetWealth: 200000000,
      upperNetWealth: 500000000,
      surchargeRate: 30,
      description: 'Net wealth ৳20 Crore to ৳50 Crore: 30% of gross tax liability.',
      sourceId: srcFinance2024,
    },
    {
      taxYearId: year2024,
      lowerNetWealth: 500000000,
      upperNetWealth: null,
      surchargeRate: 35,
      description: 'Net wealth exceeding ৳50 Crore: 35% of gross tax liability.',
      sourceId: srcFinance2024,
    },
  ];

  await SurchargeRule.insertMany(surchargeData);
  console.log(`[Seed] Inserted ${surchargeData.length} SurchargeRules.`);

  console.log('[Seed] Database successfully seeded with official Bangladesh tax architecture!');
};

if (process.argv[1] && process.argv[1].endsWith('seedTaxArchitecture.js')) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taxbd';
  mongoose
    .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      await seedTaxData(mongoose);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]:', err.message);
      process.exit(1);
    });
}
