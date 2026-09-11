import { TaxCalculationService } from '../tax-engine/index.js';
import { TaxCalculation } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const calculateTaxEstimate = async (req, res, next) => {
  try {
    const { saveRecord = false, ...payload } = req.body;
    const result = await TaxCalculationService.compute(payload, req.user, saveRecord);
    return successResponse(res, 'Tax calculation completed successfully', result);
  } catch (error) {
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
