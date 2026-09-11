import {
  getAdminTaxRulesOverview,
  updateTaxYearStatus,
  verifyTaxYearAgainstNBR,
} from '../services/taxSourceWorkflowService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getAdminRules = async (req, res, next) => {
  try {
    const overview = await getAdminTaxRulesOverview();
    return successResponse(res, 'Admin tax rules overview retrieved successfully', overview);
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
    return successResponse(res, `Tax Year ${year} verified against NBR sources`, verifiedYear);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};
