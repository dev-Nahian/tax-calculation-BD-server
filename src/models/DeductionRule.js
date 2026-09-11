import mongoose from 'mongoose';

const deductionRuleSchema = new mongoose.Schema(
  {
    taxYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxYear',
      required: true,
      index: true,
    },
    incomeCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    }, // 'salary', 'houseProperty', 'agriculture', 'business'
    deductionType: {
      type: String,
      required: true,
      trim: true,
    }, // 'house_rent_exemption', 'medical_allowance_exemption', 'conveyance_allowance_exemption', 'statutory_repair_maintenance'
    maxPercentage: {
      type: Number,
      default: null, // e.g. 50 (for 50% of basic) or 10 (for 10% of basic)
    },
    maxCap: {
      type: Number,
      default: null, // e.g. 300000 (3 Lakh cap for house rent), 120000 (1.2 Lakh for medical), 30000 (conveyance)
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    formula: {
      type: String,
      required: true,
      trim: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSource',
      required: [true, 'DeductionRule must reference an official TaxSource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

deductionRuleSchema.index({ taxYearId: 1, incomeCategory: 1, deductionType: 1 });

const DeductionRule = mongoose.model('DeductionRule', deductionRuleSchema);
export default DeductionRule;
