import { TaxCalculator } from './TaxCalculator.js';
import { getCompleteRulePackage } from '../services/ruleService.js';
import { TaxCalculation } from '../models/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * TaxCalculationService
 *
 * Coordinates database rule resolution, calculation execution, and persistence.
 * Enforces zero-fallback rule security and strict server-side calculation integrity.
 */
export class TaxCalculationService {
  static async compute(rawPayload = {}, user = null, saveHistory = false) {
    const assessmentYear = rawPayload.assessmentYear || '2024-2025';

    // 1. Fetch dynamic verified rules from database or verified rule registry
    const rulesPackage = await getCompleteRulePackage(assessmentYear);

    if (!rulesPackage || !rulesPackage.slabs || rulesPackage.slabs.length === 0) {
      const error = new Error('Tax calculation is currently unavailable for this assessment year.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Strict Input Isolation: Discard any client-calculated totals to prevent frontend tampering
    const sanitizedPayload = {
      assessmentYear,
      taxpayerProfile: {
        category: rawPayload.taxpayerProfile?.category || rawPayload.category || 'general',
        zone: rawPayload.taxpayerProfile?.zone || rawPayload.zone || 'dhaka_chattogram',
        age: rawPayload.taxpayerProfile?.age ?? rawPayload.age,
        disabledChildrenCount: rawPayload.taxpayerProfile?.disabledChildrenCount ?? rawPayload.disabledChildrenCount,
      },
      income: {
        salary: {
          basicSalary: rawPayload.income?.salary?.basicSalary ?? rawPayload.income?.salaryIncome ?? rawPayload.salaryIncome ?? 0,
          houseRentAllowance: rawPayload.income?.salary?.houseRentAllowance ?? rawPayload.income?.houseRentAllowance ?? rawPayload.houseRentAllowance ?? 0,
          medicalAllowance: rawPayload.income?.salary?.medicalAllowance ?? rawPayload.income?.medicalAllowance ?? rawPayload.medicalAllowance ?? 0,
          conveyanceAllowance: rawPayload.income?.salary?.conveyanceAllowance ?? rawPayload.income?.conveyanceAllowance ?? rawPayload.conveyanceAllowance ?? 0,
          festivalBonus: rawPayload.income?.salary?.festivalBonus ?? rawPayload.income?.festivalBonus ?? rawPayload.festivalBonus ?? 0,
          otherAllowances: rawPayload.income?.salary?.otherAllowances ?? rawPayload.income?.otherAllowances ?? rawPayload.otherAllowances ?? 0,
        },
        houseProperty: rawPayload.income?.houseProperty ?? rawPayload.income?.housePropertyIncome ?? rawPayload.housePropertyIncome ?? 0,
        agriculture: rawPayload.income?.agriculture ?? rawPayload.income?.agricultureIncome ?? rawPayload.agricultureIncome ?? 0,
        business: rawPayload.income?.business ?? rawPayload.income?.businessIncome ?? rawPayload.businessIncome ?? 0,
        capitalGain: rawPayload.income?.capitalGain ?? rawPayload.income?.capitalGains ?? rawPayload.capitalGains ?? 0,
        financialAssets: rawPayload.income?.financialAssets ?? rawPayload.income?.financialAssetsIncome ?? rawPayload.financialAssets ?? 0,
        otherSources: rawPayload.income?.otherSources ?? rawPayload.income?.otherIncome ?? rawPayload.otherIncome ?? 0,
      },
      deductions: rawPayload.deductions || {},
      rebates: rawPayload.rebates || rawPayload.investments || {},
      otherInformation: rawPayload.otherInformation || {},
    };

    // 3. Execute authoritative calculation through the tax engine
    const calculationResult = TaxCalculator.calculate(sanitizedPayload, rulesPackage);

    // 4. Optional Persistence: only when explicitly requested and authenticated / opting in
    let savedCalculationId = null;
    if ((saveHistory || (user?._id && saveHistory)) && mongoose.connection.readyState === 1) {
      try {
        const record = await TaxCalculation.create({
          userId: user?._id || null,
          assessmentYear: calculationResult.assessmentYear,
          taxpayerProfile: calculationResult.taxpayerProfile,
          incomeBreakdown: {
            salary: {
              basicSalary: sanitizedPayload.income.salary.basicSalary,
              houseRentAllowance: sanitizedPayload.income.salary.houseRentAllowance,
              medicalAllowance: sanitizedPayload.income.salary.medicalAllowance,
              conveyanceAllowance: sanitizedPayload.income.salary.conveyanceAllowance,
              festivalBonus: sanitizedPayload.income.salary.festivalBonus,
              otherAllowances: sanitizedPayload.income.salary.otherAllowances,
              totalGrossSalary: calculationResult.incomeSummary.grossSalary,
            },
            houseProperty: calculationResult.incomeSummary.houseProperty,
            agriculture: calculationResult.incomeSummary.agriculture,
            business: calculationResult.incomeSummary.business,
            capitalGain: calculationResult.incomeSummary.capitalGain,
            financialAssets: calculationResult.incomeSummary.financialAssets,
            otherSources: calculationResult.incomeSummary.otherSources,
            grossTotalIncome: calculationResult.grossIncome,
          },
          deductions: calculationResult.deductionsBreakdown,
          taxableIncome: calculationResult.taxableIncome,
          regularTax: calculationResult.regularTax,
          minimumTax: calculationResult.minimumTax.payableTax,
          surcharge: calculationResult.surcharge.surchargeAmount,
          rebate: {
            eligibleInvestments: calculationResult.rebate.allowableInvestment,
            rebateAmount: calculationResult.rebate.rebateAmount,
          },
          totalTax: calculationResult.totalTax,
          slabBreakdown: calculationResult.slabBreakdown,
          calculationVersion: calculationResult.calculationVersion,
          taxRuleVersion: calculationResult.taxRuleVersion,
          sourceVersion: calculationResult.sourceVersion,
        });
        savedCalculationId = record._id;
      } catch (err) {
        logger.warn('Could not persist calculation record', { error: err.message });
      }
    }

    return {
      ...calculationResult,
      savedCalculationId,
    };
  }
}

export default TaxCalculationService;
