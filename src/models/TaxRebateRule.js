import mongoose from 'mongoose';

const taxRebateRuleSchema = new mongoose.Schema(
  {
    taxYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxYear',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'section78_investment',
    },
    ruleType: {
      type: String,
      required: true,
      enum: ['PERCENTAGE_OF_INVESTMENT', 'SLAB_BASED_REBATE', 'FLAT_CREDIT'],
      default: 'PERCENTAGE_OF_INVESTMENT',
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 15,
    }, // 15% under Income Tax Act 2023 Sec 78
    maximumAmount: {
      type: Number,
      required: true,
      default: 1000000, // 10 Lakh cap
    },
    maxInvestmentPercentageOfIncome: {
      type: Number,
      default: 20, // Max 20% of total taxable income
    },
    formula: {
      type: String,
      required: true,
      default: 'MIN(actualInvestment, taxableIncome * 0.20, 1000000) * 0.15',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSource',
      required: [true, 'TaxRebateRule must reference an official TaxSource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

taxRebateRuleSchema.index({ taxYearId: 1, category: 1 });

const TaxRebateRule = mongoose.model('TaxRebateRule', taxRebateRuleSchema);
export default TaxRebateRule;
