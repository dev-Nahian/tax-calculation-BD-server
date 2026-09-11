import { getAllRules, getRulesByYear } from '../services/ruleService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getRules = async (req, res, next) => {
  try {
    const rules = await getAllRules();
    return successResponse(res, 'Tax rules retrieved successfully', rules);
  } catch (error) {
    next(error);
  }
};

export const getRuleByYear = async (req, res, next) => {
  try {
    const { year } = req.params;
    const rule = await getRulesByYear(year);
    if (!rule) {
      return errorResponse(res, `No tax rules found for assessment year: ${year}`, 404);
    }
    return successResponse(res, `Tax rules for ${year} retrieved successfully`, rule);
  } catch (error) {
    next(error);
  }
};
