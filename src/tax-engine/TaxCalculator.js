import { Money } from './Money.js';
import { validateTaxCalculationPayload } from './TaxValidation.js';
import { TaxThresholdCalculator } from './TaxThresholdCalculator.js';
import { TaxSlabCalculator } from './TaxSlabCalculator.js';
import { TaxRebateCalculator } from './TaxRebateCalculator.js';
import { MinimumTaxCalculator } from './MinimumTaxCalculator.js';
import { SurchargeCalculator } from './SurchargeCalculator.js';

export const ENGINE_CALCULATION_VERSION = 'v2.1.0';

/**
 * TaxCalculator
 *
 * Primary calculation pipeline orchestrator for Bangladesh personal income tax.
 */
export class TaxCalculator {
  /**
   * Main calculation entrypoint.
   */
  static calculate(payload = {}, rulesPackage = {}) {
    // 1. Strict Input Validation
    validateTaxCalculationPayload(payload);

    const assessmentYear = payload.assessmentYear || '2024-2025';
    const profile = payload.taxpayerProfile || {};
    const zone = profile.zone || 'dhaka_chattogram';
    const income = payload.income || {};
    const deductionsInput = payload.deductions || {};
    const rebatesInput = payload.rebates || payload.investments || {};
    const otherInfo = payload.otherInformation || {};

    // 2. Compute Employment / Salary Income and Statutory Deductions
    const salary = income.salary || {};
    const basicSalary = Money.from(salary.basicSalary ?? income.salaryIncome ?? 0);
    const houseRent = Money.from(salary.houseRentAllowance ?? income.houseRentAllowance ?? 0);
    const medical = Money.from(salary.medicalAllowance ?? income.medicalAllowance ?? 0);
    const conveyance = Money.from(salary.conveyanceAllowance ?? income.conveyanceAllowance ?? 0);
    const festivalBonus = Money.from(salary.festivalBonus ?? income.festivalBonus ?? 0);
    const otherAllowances = Money.from(salary.otherAllowances ?? income.otherAllowances ?? 0);

    const grossSalary = Money.add(basicSalary, houseRent, medical, conveyance, festivalBonus, otherAllowances);

    // Statutory Salary Exemptions under 6th Schedule Part 1
    // (a) House rent: Min of actual, 50% basic, 300,000 BDT
    const houseRentCap = Money.percentage(basicSalary, 50);
    const houseRentExempt = Money.min(houseRent, houseRentCap, 300000);

    // (b) Medical allowance: Min of actual, 10% basic, 120,000 BDT
    const medicalCap = Money.percentage(basicSalary, 10);
    const medicalExempt = Money.min(medical, medicalCap, 120000);

    // (c) Conveyance allowance: Min of actual, 30,000 BDT
    const conveyanceExempt = Money.min(conveyance, 30000);

    const totalSalaryExemptions = Money.add(houseRentExempt, medicalExempt, conveyanceExempt);
    const netTaxableSalary = Money.max(0, Money.subtract(grossSalary, totalSalaryExemptions));

    // 3. Compute Other 6 Heads of Income
    // House Property
    const rawHouseProperty = Money.from(income.houseProperty ?? income.housePropertyIncome ?? 0);
    const hpDeduction = Money.from(deductionsInput.housePropertyDeduction ?? 0);
    const netHouseProperty = Money.max(0, Money.subtract(rawHouseProperty, hpDeduction));

    // Agriculture
    const rawAgriculture = Money.from(income.agriculture ?? income.agricultureIncome ?? 0);
    const agriDeduction = Money.from(deductionsInput.agricultureDeduction ?? 0);
    const netAgriculture = Money.max(0, Money.subtract(rawAgriculture, agriDeduction));

    // Business
    const rawBusiness = Money.from(income.business ?? income.businessIncome ?? 0);
    const bizDeduction = Money.from(deductionsInput.businessExpenses ?? 0);
    const netBusiness = Money.max(0, Money.subtract(rawBusiness, bizDeduction));

    // Capital Gains
    const rawCapitalGains = Money.from(income.capitalGain ?? income.capitalGains ?? 0);
    const capitalDeduction = Money.from(deductionsInput.capitalGainDeduction ?? 0);
    const netCapitalGains = Money.max(0, Money.subtract(rawCapitalGains, capitalDeduction));

    // Financial Assets
    const rawFinancial = Money.from(income.financialAssets ?? income.financialAssetsIncome ?? 0);
    const finDeduction = Money.from(deductionsInput.financialAssetsDeduction ?? 0);
    const netFinancial = Money.max(0, Money.subtract(rawFinancial, finDeduction));

    // Other Sources
    const rawOther = Money.from(income.otherSources ?? income.otherIncome ?? 0);
    const otherDeduction = Money.from(deductionsInput.otherSourcesDeduction ?? 0);
    const netOther = Money.max(0, Money.subtract(rawOther, otherDeduction));

    // 4. Aggregations
    const grossIncome = Money.add(
      grossSalary,
      rawHouseProperty,
      rawAgriculture,
      rawBusiness,
      rawCapitalGains,
      rawFinancial,
      rawOther
    );

    const totalOtherDeductions = Money.add(
      hpDeduction,
      agriDeduction,
      bizDeduction,
      capitalDeduction,
      finDeduction,
      otherDeduction
    );

    const totalDeductions = Money.add(totalSalaryExemptions, totalOtherDeductions);
    const taxableIncome = Money.max(0, Money.subtract(grossIncome, totalDeductions));

    // 5. Tax-Free Exemption Threshold Determination
    const thresholdResult = TaxThresholdCalculator.calculate(profile, rulesPackage.thresholds);
    const taxFreeThreshold = thresholdResult.totalTaxFreeLimit;

    // 6. Progressive Tiered Slabs Calculation
    const slabResult = TaxSlabCalculator.calculate(taxableIncome, taxFreeThreshold, rulesPackage.slabs);
    const regularTax = slabResult.regularTax;

    // 7. Section 78 Investment Rebate
    const rebateResult = TaxRebateCalculator.calculate(taxableIncome, rebatesInput, rulesPackage.rebates);
    const allowableRebate = rebateResult.rebateAmount;
    const taxAfterRebate = Money.max(0, Money.subtract(regularTax, allowableRebate));

    // 8. Minimum Tax Verification
    const minTaxResult = MinimumTaxCalculator.calculate(
      taxableIncome,
      taxFreeThreshold,
      taxAfterRebate,
      zone,
      rulesPackage.minimumTaxes
    );
    const taxAfterMinimum = minTaxResult.payableTax;

    // 9. Net Wealth Surcharge Computation
    const surchargeResult = SurchargeCalculator.calculate(taxAfterMinimum, otherInfo, rulesPackage.surcharges);
    const surchargeAmount = surchargeResult.surchargeAmount;

    // 10. Total Final Tax Liability
    const totalTax = Money.add(taxAfterMinimum, surchargeAmount);

    // 11. Effective Tax Rate (Percentage of Gross Income)
    const effectiveTaxRate = grossIncome > 0
      ? Number(((totalTax / grossIncome) * 100).toFixed(2))
      : 0;

    // 12. Compile Official NBR Sources Traceability
    const sources = (rulesPackage.sources || []).map((s) => ({
      id: s._id || s.id,
      title: s.title,
      referenceNumber: s.referenceNumber,
      authority: s.authority,
      sourceUrl: s.sourceUrl,
      sourceType: s.sourceType,
      publicationDate: s.publicationDate,
    }));

    return {
      assessmentYear,
      incomeYear: rulesPackage.taxYear?.incomeYear || (assessmentYear === '2024-2025' ? '2023-2024' : '2024-2025'),
      taxpayerProfile: {
        category: thresholdResult.category,
        zone,
        baseThreshold: thresholdResult.baseLimit,
        dependentAllowance: thresholdResult.dependentExemption,
        totalTaxFreeThreshold: taxFreeThreshold,
      },
      incomeSummary: {
        grossSalary: Money.from(grossSalary),
        salaryDeductions: Money.from(totalSalaryExemptions),
        netSalary: Money.from(netTaxableSalary),
        houseProperty: Money.from(netHouseProperty),
        agriculture: Money.from(netAgriculture),
        business: Money.from(netBusiness),
        capitalGain: Money.from(netCapitalGains),
        financialAssets: Money.from(netFinancial),
        otherSources: Money.from(netOther),
      },
      deductionsBreakdown: {
        houseRentExemption: Money.from(houseRentExempt),
        medicalExemption: Money.from(medicalExempt),
        conveyanceExemption: Money.from(conveyanceExempt),
        otherHeadDeductions: Money.from(totalOtherDeductions),
        totalDeductions: Money.from(totalDeductions),
      },
      grossIncome: Money.from(grossIncome),
      totalDeductions: Money.from(totalDeductions),
      taxableIncome: Money.from(taxableIncome),
      taxFreeThreshold: Money.from(taxFreeThreshold),
      taxFreeIncome: Money.min(taxableIncome, taxFreeThreshold),
      slabBreakdown: slabResult.slabBreakdown,
      regularTax: Money.from(regularTax),
      rebate: {
        actualInvestments: rebateResult.actualInvestments,
        incomeCeiling: rebateResult.incomeCeiling,
        maxStatutoryCap: rebateResult.maxStatutoryCap,
        allowableInvestment: rebateResult.allowableInvestment,
        rebateRate: rebateResult.rebateRate,
        rebateAmount: allowableRebate,
      },
      taxAfterRebate: Money.from(taxAfterRebate),
      minimumTax: {
        applicable: minTaxResult.applicable,
        zone: minTaxResult.zone,
        statutoryMinimum: minTaxResult.statutoryMinimum,
        payableTax: minTaxResult.payableTax,
        isMinimumTaxEnforced: minTaxResult.isMinimumTaxEnforced,
        reason: minTaxResult.reason,
      },
      surcharge: {
        netWealth: surchargeResult.netWealth,
        surchargeRate: surchargeResult.surchargeRate,
        tierDescription: surchargeResult.tierDescription,
        surchargeAmount: surchargeResult.surchargeAmount,
      },
      totalTax: Money.from(totalTax),
      effectiveTaxRate,
      calculationVersion: ENGINE_CALCULATION_VERSION,
      taxRuleVersion: rulesPackage.taxYear?.taxRuleVersion || 'v2024.1-nbr',
      sourceVersion: rulesPackage.taxYear?.sourceVersion || 'ACT-18-2024',
      sources,
      calculatedAt: new Date().toISOString(),
    };
  }
}

export default TaxCalculator;
