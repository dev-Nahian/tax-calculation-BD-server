import {
  TaxYear,
  TaxRule,
  TaxThreshold,
  TaxSlab,
  TaxRebateRule,
  MinimumTaxRule,
  SurchargeRule,
  TaxSource,
  TaxCalculation,
  AdminAuditLog,
  User,
} from '../models/index.js';
import {
  getAdminTaxRulesOverview,
  updateTaxYearStatus,
  verifyTaxYearAgainstNBR,
} from '../services/taxSourceWorkflowService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

/**
 * Log an administrative mutation to the immutable audit trail
 */
const logAdminAction = async (adminUser, action, collectionName, documentId, before, after) => {
  try {
    logger.adminAction({
      adminId: adminUser?._id,
      action,
      target: `${collectionName}:${documentId}`,
      details: { before, after },
    });

    if (adminUser?._id) {
      await AdminAuditLog.create({
        adminId: adminUser._id,
        action,
        collectionName,
        documentId,
        before,
        after,
        timestamp: new Date(),
      });
    }
  } catch (err) {
    logger.warn('[AdminAudit] Could not write audit log:', { error: err.message });
  }
};

/**
 * 1. Admin Dashboard Overview Statistics
 */
export const getAdminOverview = async (req, res, next) => {
  try {
    const [
      activeTaxYear,
      taxYearsCount,
      taxRulesCount,
      taxSlabsCount,
      sourcesCount,
      verifiedSourcesCount,
      pendingYearsCount,
      recentAuditLogs,
      recentCalculations,
    ] = await Promise.all([
      TaxYear.findOne({ status: 'active' }),
      TaxYear.countDocuments(),
      TaxRule.countDocuments({ isArchived: { $ne: true } }),
      TaxSlab.countDocuments(),
      TaxSource.countDocuments(),
      TaxSource.countDocuments({ verificationStatus: 'verified' }),
      TaxYear.countDocuments({ status: { $in: ['draft', 'under_review'] } }),
      AdminAuditLog.find().sort({ createdAt: -1 }).limit(10).populate('adminId', 'name email role'),
      TaxCalculation.find().sort({ createdAt: -1 }).limit(10),
    ]);

    const lastRule = await TaxRule.findOne().sort({ updatedAt: -1 });

    const stats = {
      activeAssessmentYear: activeTaxYear?.assessmentYear || '2024-2025',
      activeStatus: activeTaxYear?.status || 'active',
      totalTaxYears: taxYearsCount,
      totalTaxRules: taxRulesCount + taxSlabsCount,
      totalSources: sourcesCount,
      verifiedSources: verifiedSourcesCount || sourcesCount,
      pendingReviews: pendingYearsCount,
      lastRuleUpdate: lastRule?.updatedAt || activeTaxYear?.updatedAt || new Date(),
      lastRuleAuthor: 'Admin Research Team',
      recentAuditLogs,
      recentCalculations,
    };

    return successResponse(res, 'Admin overview statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Tax Years Management
 */
export const getTaxYearsList = async (req, res, next) => {
  try {
    const years = await TaxYear.find().sort({ assessmentYear: -1 });
    return successResponse(res, 'Tax years retrieved', years);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { year } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 'Status field is required', 400);
    }

    const updatedYear = await updateTaxYearStatus(year, status, req.user);
    await logAdminAction(req.user, 'UPDATE_RULE', 'TaxYear', updatedYear._id, null, { status });
    return successResponse(res, `Tax Year ${year} status updated to ${status}`, updatedYear);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const verifyRules = async (req, res, next) => {
  try {
    const { year } = req.params;
    const { note } = req.body;

    const verifiedYear = await verifyTaxYearAgainstNBR(year, note, req.user);
    await logAdminAction(req.user, 'UPDATE_RULE', 'TaxYear', verifiedYear._id, null, { verified: true, note });
    return successResponse(res, `Tax Year ${year} verified against NBR sources`, verifiedYear);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

/**
 * 3. Tax Slabs Management
 */
export const getTaxSlabsList = async (req, res, next) => {
  try {
    const { assessmentYear } = req.query;
    const query = assessmentYear ? { assessmentYear } : {};
    const slabs = await TaxSlab.find(query).sort({ sequence: 1 });
    return successResponse(res, 'Tax slabs retrieved', slabs);
  } catch (error) {
    next(error);
  }
};

export const saveTaxSlab = async (req, res, next) => {
  try {
    const { id, assessmentYear, sequence, lowerLimit, upperLimit, rate, description } = req.body;

    let slab;
    if (id) {
      const before = await TaxSlab.findById(id);
      slab = await TaxSlab.findByIdAndUpdate(
        id,
        { assessmentYear, sequence, lowerLimit, upperLimit, rate, description },
        { new: true }
      );
      await logAdminAction(req.user, 'UPDATE_RULE', 'TaxSlab', slab._id, before, slab);
    } else {
      slab = await TaxSlab.create({
        assessmentYear: assessmentYear || '2024-2025',
        sequence,
        lowerLimit,
        upperLimit,
        rate,
        description,
      });
      await logAdminAction(req.user, 'CREATE_RULE', 'TaxSlab', slab._id, null, slab);
    }

    return successResponse(res, 'Tax slab saved successfully', slab);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Tax Sources & Citations
 */
export const getTaxSourcesList = async (req, res, next) => {
  try {
    const { assessmentYear } = req.query;
    const query = assessmentYear ? { assessmentYear } : {};
    const sources = await TaxSource.find(query).sort({ publicationDate: -1 });
    return successResponse(res, 'Tax sources retrieved', sources);
  } catch (error) {
    next(error);
  }
};

export const saveTaxSource = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let source;
    if (id) {
      const before = await TaxSource.findById(id);
      source = await TaxSource.findByIdAndUpdate(id, data, { new: true });
      await logAdminAction(req.user, 'UPDATE_RULE', 'TaxSource', source._id, before, source);
    } else {
      source = await TaxSource.create(data);
      await logAdminAction(req.user, 'CREATE_RULE', 'TaxSource', source._id, null, source);
    }
    return successResponse(res, 'Tax source saved successfully', source);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Section 78 Rebates Management
 */
export const getRebatesList = async (req, res, next) => {
  try {
    const { assessmentYear } = req.query;
    const query = assessmentYear ? { assessmentYear } : {};
    const rebates = await TaxRebateRule.find(query);
    return successResponse(res, 'Rebates list retrieved', rebates);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Minimum Taxes & Surcharges
 */
export const getMinimumTaxesList = async (req, res, next) => {
  try {
    const { assessmentYear } = req.query;
    const query = assessmentYear ? { assessmentYear } : {};
    const minTaxes = await MinimumTaxRule.find(query);
    return successResponse(res, 'Minimum taxes retrieved', minTaxes);
  } catch (error) {
    next(error);
  }
};

export const getSurchargeList = async (req, res, next) => {
  try {
    const { assessmentYear } = req.query;
    const query = assessmentYear ? { assessmentYear } : {};
    const surcharges = await SurchargeRule.find(query);
    return successResponse(res, 'Surcharge rules retrieved', surcharges);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. User Calculation Audit Trail
 */
export const getCalculationsAuditList = async (req, res, next) => {
  try {
    const calculations = await TaxCalculation.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name email role');
    return successResponse(res, 'Calculations audit retrieved', calculations);
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Admin Users List
 */
export const getAdminUsersList = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return successResponse(res, 'Admin users retrieved', users);
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Admin Audit Logs
 */
export const getAdminAuditLogs = async (req, res, next) => {
  try {
    const logs = await AdminAuditLog.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('adminId', 'name email role');
    return successResponse(res, 'Admin audit logs retrieved', logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy wrapper
 */
export const getAdminRules = async (req, res, next) => {
  return getAdminOverview(req, res, next);
};
