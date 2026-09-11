import mongoose from 'mongoose';

const slabSchema = new mongoose.Schema(
  {
    slabLimit: { type: Number, required: true }, // Amount for this slab or Infinity for remaining
    rate: { type: Number, required: true }, // Rate in percentage (e.g. 5 for 5%)
    description: { type: String, required: true },
  },
  { _id: false }
);

const taxRuleSchema = new mongoose.Schema(
  {
    assessmentYear: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    }, // e.g. "2024-2025", "2025-2026"
    title: {
      type: String,
      required: true,
    },
    effectiveFrom: {
      type: Date,
    },
    effectiveTo: {
      type: Date,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    exemptionThresholds: {
      general: { type: Number, default: 350000 },
      female: { type: Number, default: 400000 },
      senior: { type: Number, default: 400000 }, // 65 years and above
      disabled: { type: Number, default: 475000 },
      gazettedFreedomFighter: { type: Number, default: 500000 },
      parentOfDisabledChildExtra: { type: Number, default: 50000 },
    },
    slabs: [slabSchema],
    minimumTax: {
      dhaka_chattogram: { type: Number, default: 5000 },
      other_city_corporation: { type: Number, default: 4000 },
      non_city_corporation: { type: Number, default: 3000 },
    },
    investmentRebate: {
      rebateRate: { type: Number, default: 15 }, // 15% on eligible investment
      maxInvestmentPercentageOfTotalIncome: { type: Number, default: 20 }, // Max 20% of taxable income
      maxAllowableInvestmentCap: { type: Number, default: 1000000 }, // Cap on rebate (10 lakh)
    },
    houseRentExemption: {
      maxPercentageOfBasicSalary: { type: Number, default: 50 },
      maxMonthlyCap: { type: Number, default: 25000 },
    },
    medicalAllowanceExemption: {
      maxPercentageOfBasicSalary: { type: Number, default: 10 },
      maxYearlyCap: { type: Number, default: 120000 },
    },
    conveyanceExemption: {
      maxYearlyCap: { type: Number, default: 30000 },
    },
    notes: [String],
  },
  {
    timestamps: true,
  }
);

const TaxRule = mongoose.model('TaxRule', taxRuleSchema);
export default TaxRule;
