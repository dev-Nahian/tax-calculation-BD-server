import mongoose from 'mongoose';

const surchargeRuleSchema = new mongoose.Schema(
  {
    taxYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxYear',
      required: true,
      index: true,
    },
    lowerNetWealth: {
      type: Number,
      required: true,
      min: 0,
    }, // in BDT, e.g., 0, 40000000 (4 Crore), 100000000 (10 Crore), etc.
    upperNetWealth: {
      type: Number,
      default: null, // null for highest wealth tier (above 50 Crore)
    },
    surchargeRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    }, // Percentage of gross tax: 0, 10, 20, 30, 35
    specialConditions: {
      type: String,
      trim: true,
      default: null, // e.g. "Owning more than 1 motor car or 8,000+ sq ft residential property"
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSource',
      required: [true, 'SurchargeRule must reference an official TaxSource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

surchargeRuleSchema.index({ taxYearId: 1, lowerNetWealth: 1 });

const SurchargeRule = mongoose.model('SurchargeRule', surchargeRuleSchema);
export default SurchargeRule;
