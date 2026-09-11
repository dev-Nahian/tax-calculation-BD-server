import mongoose from 'mongoose';

const incomeCategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: [
        'salary',
        'houseProperty',
        'agriculture',
        'business',
        'capitalGain',
        'financialAssets',
        'otherSources',
      ],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sectionReference: {
      type: String,
      required: true,
      trim: true,
    }, // e.g. "Section 32 (Employment Income), Income Tax Act 2023"
    calculationMethod: {
      type: String,
      required: true,
      enum: ['STANDARD_ALLOWANCE_DEDUCTION', 'NET_RENTAL_EXPENSE', 'NET_PROFIT_EXPENSE', 'FLAT_TAX_RATE', 'ACTUAL_GAIN'],
      default: 'STANDARD_ALLOWANCE_DEDUCTION',
    },
    allowableDeductionsDescription: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSource',
      required: [true, 'IncomeCategory must reference an official TaxSource'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const IncomeCategory = mongoose.model('IncomeCategory', incomeCategorySchema);
export default IncomeCategory;
