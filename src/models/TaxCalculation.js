import mongoose from 'mongoose';

const taxCalculationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assessmentYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    taxpayerProfile: {
      category: { type: String, required: true },
      zone: { type: String, required: true },
      age: { type: Number },
      gender: { type: String },
      hasDisabledChild: { type: Boolean, default: false },
      disabledChildrenCount: { type: Number, default: 0 },
    },
    incomeBreakdown: {
      salary: {
        basicSalary: { type: Number, default: 0 },
        houseRentAllowance: { type: Number, default: 0 },
        medicalAllowance: { type: Number, default: 0 },
        conveyanceAllowance: { type: Number, default: 0 },
        festivalBonus: { type: Number, default: 0 },
        otherAllowances: { type: Number, default: 0 },
        totalGrossSalary: { type: Number, default: 0 },
      },
      houseProperty: { type: Number, default: 0 },
      agriculture: { type: Number, default: 0 },
      business: { type: Number, default: 0 },
      capitalGain: { type: Number, default: 0 },
      financialAssets: { type: Number, default: 0 },
      otherSources: { type: Number, default: 0 },
      grossTotalIncome: { type: Number, default: 0 },
    },
    deductions: {
      houseRentExemption: { type: Number, default: 0 },
      medicalExemption: { type: Number, default: 0 },
      conveyanceExemption: { type: Number, default: 0 },
      totalAllowableDeductions: { type: Number, default: 0 },
    },
    taxableIncome: {
      type: Number,
      required: true,
      min: 0,
    },
    regularTax: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumTax: {
      type: Number,
      required: true,
      min: 0,
    },
    surcharge: {
      type: Number,
      default: 0,
    },
    rebate: {
      eligibleInvestments: { type: Number, default: 0 },
      rebateAmount: { type: Number, default: 0 },
    },
    totalTax: {
      type: Number,
      required: true,
      min: 0,
    },
    slabBreakdown: [
      {
        slabDescription: String,
        taxableAmountInSlab: Number,
        rate: Number,
        taxInSlab: Number,
      },
    ],
    calculationVersion: {
      type: String,
      default: 'v2.1.0',
    },
    taxRuleVersion: {
      type: String,
      default: 'v2024.1-nbr',
    },
    sourceVersion: {
      type: String,
      default: 'src-act12-2023',
    },
  },
  {
    timestamps: true,
  }
);

taxCalculationSchema.index({ assessmentYear: 1, createdAt: -1 });

const TaxCalculation = mongoose.model('TaxCalculation', taxCalculationSchema);
export default TaxCalculation;
