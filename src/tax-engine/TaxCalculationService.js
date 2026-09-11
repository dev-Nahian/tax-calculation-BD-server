import { TaxCalculator } from './TaxCalculator.js';
import { getCompleteRulePackage } from '../services/ruleService.js';
import { TaxCalculation } from '../models/index.js';
import mongoose from 'mongoose';

/**
 * TaxCalculationService
 *
 * Coordinates database rule resolution, calculation execution, and persistence.
 */
export class TaxCalculationService {
  static async compute(payload = {}, user = null, saveHistory = false) {
    const assessmentYear = payload.assessmentYear || '2024-2025';

    // 1. Fetch dynamic rules from database/fallback
    const rulesPackage = await getCompleteRulePackage(assessmentYear);

    // 2. Execute calculation through the engine
    const calculationResult = TaxCalculator.calculate(payload, rulesPackage);

    // 3. Persist calculation history if user is authenticated or save requested
    let savedCalculationId = null;
    if ((saveHistory || user?._id) && mongoose.connection.readyState === 1) {
      try {
        const record = await TaxCalculation.create({
          userId: user?._id || null,
          assessmentYear: calculationResult.assessmentYear,
          taxpayerProfile: calculationResult.taxpayerProfile,
          incomeBreakdown: {
            salary: {
              basicSalary: payload.income?.salary?.basicSalary || payload.income?.salaryIncome || 0,
              houseRentAllowance: payload.income?.salary?.houseRentAllowance || payload.income?.houseRentAllowance || 0,
              medicalAllowance: payload.income?.salary?.medicalAllowance || payload.income?.medicalAllowance || 0,
              conveyanceAllowance: payload.income?.salary?.conveyanceAllowance || payload.income?.conveyanceAllowance || 0,
              festivalBonus: payload.income?.salary?.festivalBonus || payload.income?.festivalBonus || 0,
              otherAllowances: payload.income?.salary?.otherAllowances || payload.income?.otherAllowances || 0,
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
        console.warn('[TaxCalculationService] Could not persist calculation record:', err.message);
      }
    }

    return {
      ...calculationResult,
      savedCalculationId,
    };
  }
}

export default TaxCalculationService;
