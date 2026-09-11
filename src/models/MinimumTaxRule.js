import mongoose from 'mongoose';

const minimumTaxRuleSchema = new mongoose.Schema(
  {
    taxYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxYear',
      required: true,
      index: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    }, // 'dhaka_chattogram', 'other_city_corporation', 'non_city_corporation'
    zoneName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    }, // 5000, 4000, 3000
    description: {
      type: String,
      required: true,
      trim: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSource',
      required: [true, 'MinimumTaxRule must reference an official TaxSource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

minimumTaxRuleSchema.index({ taxYearId: 1, zone: 1 }, { unique: true });

const MinimumTaxRule = mongoose.model('MinimumTaxRule', minimumTaxRuleSchema);
export default MinimumTaxRule;
