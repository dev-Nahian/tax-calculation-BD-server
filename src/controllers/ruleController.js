import {
  getAllTaxYears,
  getCompleteRulePackage,
  getAllSources,
  getTaxpayerCategories,
  getIncomeCategories,
} from '../services/ruleService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getYears = async (req, res, next) => {
  try {
    const years = await getAllTaxYears();
    return successResponse(res, 'Assessment years retrieved successfully', years);
  } catch (error) {
    next(error);
  }
};

export const getSources = async (req, res, next) => {
  try {
    const sources = await getAllSources();
    return successResponse(res, 'Official NBR tax sources retrieved successfully', sources);
  } catch (error) {
    next(error);
  }
};

export const getSourcesByYear = async (req, res, next) => {
  try {
    const { year } = req.params;
    const rulePackage = await getCompleteRulePackage(year);
    const sources = rulePackage?.sources || [];
    return successResponse(res, `Official NBR tax sources for ${year} retrieved successfully`, sources);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await getTaxpayerCategories();
    return successResponse(res, 'Taxpayer categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

export const getIncomeHeads = async (req, res, next) => {
  try {
    const heads = await getIncomeCategories();
    return successResponse(res, 'Income categories retrieved successfully', heads);
  } catch (error) {
    next(error);
  }
};

export const getRuleByYear = async (req, res, next) => {
  try {
    const { year } = req.params;
    const rulePackage = await getCompleteRulePackage(year);
    if (!rulePackage) {
      return errorResponse(res, `No tax rules found for assessment year: ${year}`, 404);
    }
    return successResponse(res, `Complete tax rules for AY ${year} retrieved successfully`, rulePackage);
  } catch (error) {
    next(error);
  }
};

export const getRules = async (req, res, next) => {
  try {
    const activeRule = await getCompleteRulePackage('2024-2025');
    return successResponse(res, 'Active tax rules retrieved successfully', activeRule);
  } catch (error) {
    next(error);
  }
};
