import mongoose from 'mongoose';

const taxRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    assessmentYear: {
      type: String,
      required: true,
      default: '2024-2025',
    },
    category: {
      type: String,
      enum: ['general', 'female', 'senior', 'disabled', 'gazetted_freedom_fighter', 'parent_of_disabled'],
      default: 'general',
    },
    zone: {
      type: String,
      enum: ['dhaka_chattogram', 'other_city_corporation', 'non_city_corporation'],
      default: 'dhaka_chattogram',
    },
    inputs: {
      salaryIncome: { type: Number, default: 0 },
      houseRentAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      conveyanceAllowance: { type: Number, default: 0 },
      festivalBonus: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
      businessIncome: { type: Number, default: 0 },
      housePropertyIncome: { type: Number, default: 0 },
      agricultureIncome: { type: Number, default: 0 },
      capitalGains: { type: Number, default: 0 },
      otherIncome: { type: Number, default: 0 },
      investments: {
        dps: { type: Number, default: 0 },
        sanchayapatra: { type: Number, default: 0 },
        lifeInsurance: { type: Number, default: 0 },
        stockMarket: { type: Number, default: 0 },
        providentFund: { type: Number, default: 0 },
        otherEligible: { type: Number, default: 0 },
      },
    },
    results: {
      grossIncome: { type: Number, default: 0 },
      totalExemptions: { type: Number, default: 0 },
      taxableIncome: { type: Number, default: 0 },
      grossTaxLiability: { type: Number, default: 0 },
      eligibleInvestment: { type: Number, default: 0 },
      investmentRebate: { type: Number, default: 0 },
      netTaxBeforeMinimum: { type: Number, default: 0 },
      minimumTax: { type: Number, default: 0 },
      finalTaxLiability: { type: Number, default: 0 },
      effectiveTaxRate: { type: Number, default: 0 },
      slabBreakdown: [
        {
          slab: String,
          rate: Number,
          amountInSlab: Number,
          taxInSlab: Number,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const TaxRecord = mongoose.model('TaxRecord', taxRecordSchema);
export default TaxRecord;
