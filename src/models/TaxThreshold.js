import mongoose from 'mongoose';

const taxThresholdSchema = new mongoose.Schema(
  {
    taxYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxYear',
      required: true,
      index: true,
    },
    taxpayerCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    }, // 'general', 'female', 'seniorCitizen', 'thirdGender', 'disabled', 'freedomFighter', 'parentOfDisabled'
    taxFreeLimit: {
      type: Number,
      required: true,
      min: 0,
    }, // e.g., 350000, 400000, 475000, 500000
    additionalDependentAllowance: {
      type: Number,
      default: 50000, // For parents of disabled child (50,000 per child)
      min: 0,
    },
    minimumTax: {
      dhakaChattogram: { type: Number, default: 5000 },
      otherCityCorporation: { type: Number, default: 4000 },
      nonCityCorporation: { type: Number, default: 3000 },
    },
    notes: {
      type: String,
      trim: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSource',
      required: [true, 'TaxThreshold must reference a TaxSource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

taxThresholdSchema.index({ taxYearId: 1, taxpayerCategory: 1 }, { unique: true });

const TaxThreshold = mongoose.model('TaxThreshold', taxThresholdSchema);
export default TaxThreshold;
