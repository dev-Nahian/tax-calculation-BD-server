import TaxRule from '../models/TaxRule.js';
import { defaultRulesData } from '../seed/seedRules.js';

export const getRulesByYear = async (year = '2024-2025') => {
  try {
    const rule = await TaxRule.findOne({ assessmentYear: year });
    if (rule) return rule;
  } catch (err) {
    // Database may be offline, fallback to in-memory seed
  }

  const fallback = defaultRulesData.find((r) => r.assessmentYear === year);
  return fallback || defaultRulesData[0];
};

export const getAllRules = async () => {
  try {
    const rules = await TaxRule.find({}).sort({ assessmentYear: -1 });
    if (rules && rules.length > 0) return rules;
  } catch (err) {
    // Fallback to in-memory data
  }
  return defaultRulesData;
};
