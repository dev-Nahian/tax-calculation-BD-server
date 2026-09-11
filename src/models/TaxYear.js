import mongoose from 'mongoose';

const taxYearSchema = new mongoose.Schema(
  {
    assessmentYear: {
      type: String,
      required: [true, 'Assessment Year is required'],
      unique: true,
      trim: true,
      index: true,
    }, // e.g., "2024-2025", "2025-2026", "2026-2027"
    incomeYear: {
      type: String,
      required: [true, 'Income Year is required'],
      trim: true,
    }, // e.g., "2023-2024", "2024-2025"
    title: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'underReview', 'verified', 'active', 'archived'],
      default: 'underReview',
      index: true,
    },
    taxRuleVersion: {
      type: String,
      default: 'v1.0-act2023',
      trim: true,
    },
    sourceVersion: {
      type: String,
      default: 'src-nbr-2024',
      trim: true,
    },
    lastVerifiedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verificationNote: {
      type: String,
      default: 'Tax rules verified against published National Board of Revenue (NBR) documents.',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    officialSource: {
      type: String,
      required: true,
      trim: true,
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const TaxYear = mongoose.model('TaxYear', taxYearSchema);
export default TaxYear;
