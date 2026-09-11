import { getRulesByYear } from '../services/ruleService.js';
import { estimateTax } from '../tax-engine/index.js';
import TaxRecord from '../models/TaxRecord.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const calculateTaxEstimate = async (req, res, next) => {
  try {
    const {
      assessmentYear = '2024-2025',
      category = 'general',
      zone = 'dhaka_chattogram',
      inputs = {},
      saveRecord = false,
    } = req.body;

    const rule = await getRulesByYear(assessmentYear);
    const result = estimateTax({ category, zone, inputs }, rule);

    let savedRecordId = null;
    if (saveRecord && req.user?._id) {
      try {
        const record = await TaxRecord.create({
          userId: req.user._id,
          assessmentYear,
          category,
          zone,
          inputs,
          results: result,
        });
        savedRecordId = record._id;
      } catch (err) {
        console.warn('Could not persist tax record:', err.message);
      }
    }

    return successResponse(res, 'Tax estimate calculated successfully', {
      assessmentYear,
      category,
      zone,
      inputs,
      results: result,
      savedRecordId,
      disclaimer: 'This estimate is provided for educational and informational purposes only based on Bangladesh Income Tax Act 2023. It is not official tax filing advice.',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserTaxHistory = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return errorResponse(res, 'User authentication required', 401);
    }
    const records = await TaxRecord.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return successResponse(res, 'Tax calculation history retrieved', records);
  } catch (error) {
    next(error);
  }
};
