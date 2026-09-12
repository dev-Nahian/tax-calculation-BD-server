import { TaxCalculationService } from '../tax-engine/index.js';
import { TaxCalculation } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const calculateTaxEstimate = async (req, res, next) => {
  try {
    const { saveRecord = false, ...payload } = req.body;
    const result = await TaxCalculationService.compute(payload, req.user, saveRecord);
    return successResponse(res, 'Tax calculation completed successfully', result);
  } catch (error) {
    logger.calculationError({
      assessmentYear: req.body?.assessmentYear || '2024-2025',
      errorName: error.name,
      errorMessage: error.message,
      ip: req.ip,
    });

    if (error.message === 'Tax calculation is currently unavailable for this assessment year.') {
      return errorResponse(res, error.message, 400);
    }

    if (error.name === 'TaxValidationError') {
      return errorResponse(res, error.message, 422, error.errors);
    }

    next(error);
  }
};

export const getUserTaxHistory = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return errorResponse(res, 'User authentication required', 401);
    }
    const records = await TaxCalculation.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return successResponse(res, 'Tax calculation history retrieved', records);
  } catch (error) {
    next(error);
  }
};

export const deleteTaxHistoryRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.user?._id) {
      return errorResponse(res, 'User authentication required', 401);
    }

    const record = await TaxCalculation.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!record) {
      return errorResponse(res, 'Calculation record not found or unauthorized to delete', 404);
    }

    return successResponse(res, 'Tax calculation record successfully deleted', { id });
  } catch (error) {
    next(error);
  }
};

export const clearAllTaxHistory = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return errorResponse(res, 'User authentication required', 401);
    }

    const result = await TaxCalculation.deleteMany({ userId: req.user._id });
    return successResponse(res, 'All tax calculation history cleared successfully', {
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrivacyPolicy = (req, res) => {
  return successResponse(res, 'TaxBD Privacy Policy & Data Usage Statement', {
    policyVersion: '2026.1',
    anonymousUsage: {
      allowed: true,
      description: 'Tax calculations can be performed completely anonymously without registration or login.',
    },
    dataStorage: {
      default: 'No tax calculation input is stored on our servers unless you explicitly request to save it.',
      authenticatedUsers: 'Logged-in users have the option to save calculation summaries to review tax history.',
      deletionRights: 'Users can delete individual records or wipe their entire calculation history at any time.',
      sensitiveData: 'TaxBD never stores sensitive bank credentials, full TIN identity dossiers, or unhashed passwords.',
    },
    regulatoryCompliance: 'Compliant with Bangladesh Information and Communication Technology Act & NBR Digital Guidelines.',
  });
};
