import mongoose from 'mongoose';

const taxpayerCategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    }, // 'general', 'female', 'seniorCitizen', 'thirdGender', 'disabled', 'freedomFighter', 'parentOfDisabled'
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    eligibilityCriteria: {
      type: String,
      trim: true,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSource',
      required: [true, 'TaxpayerCategory must reference an official TaxSource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const TaxpayerCategory = mongoose.model('TaxpayerCategory', taxpayerCategorySchema);
export default TaxpayerCategory;
