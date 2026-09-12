import mongoose from 'mongoose';

const taxSourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Source title is required'],
      trim: true,
    },
    sourceType: {
      type: String,
      required: [true, 'Source type is required'],
      enum: [
        'NBR_GUIDE',
        'NBR_CIRCULAR',
        'NBR_ACT',
        'NBR_RULE',
        'NBR_SRO',
        'NBR_GENERAL_ORDER',
        'NBR_OFFICIAL_NOTICE',
        'GOVERNMENT_BUDGET',
      ],
      default: 'NBR_ACT',
    },
    ruleClassification: {
      type: String,
      enum: ['OFFICIAL_RULE', 'EXPLANATION', 'APPLICATION_CALCULATION'],
      default: 'OFFICIAL_RULE',
      required: true,
    },
    authority: {
      type: String,
      required: true,
      default: 'National Board of Revenue (NBR), Bangladesh',
      trim: true,
    },
    assessmentYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    publicationDate: {
      type: Date,
      required: true,
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    documentUrl: {
      type: String,
      trim: true,
      default: null,
    },
    referenceNumber: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    checksum: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'underReview', 'verified', 'active', 'archived'],
      default: 'active',
      index: true,
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
    retrievedAt: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

taxSourceSchema.index({ sourceType: 1, assessmentYear: 1 });
taxSourceSchema.index({ referenceNumber: 1 });

const TaxSource = mongoose.model('TaxSource', taxSourceSchema);
export default TaxSource;
