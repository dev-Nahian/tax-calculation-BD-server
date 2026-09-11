import mongoose from 'mongoose';

const taxSlabSchema = new mongoose.Schema(
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
      default: 'general',
      index: true,
    }, // 'general', 'female', 'seniorCitizen', 'thirdGender', 'disabled', 'freedomFighter'
    lowerLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    upperLimit: {
      type: Number,
      default: null, // null represents Infinity (the highest slab)
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    }, // Percentage: 0, 5, 10, 15, 20, 25
    sequence: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSource',
      required: [true, 'TaxSlab must reference a valid TaxSource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

taxSlabSchema.index({ taxYearId: 1, category: 1, sequence: 1 }, { unique: true });

const TaxSlab = mongoose.model('TaxSlab', taxSlabSchema);
export default TaxSlab;
