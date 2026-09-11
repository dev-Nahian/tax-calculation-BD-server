import express from 'express';
import {
  getYears,
  getSources,
  getCategories,
  getIncomeHeads,
  getRuleByYear,
  getRules,
} from '../controllers/ruleController.js';

const router = express.Router();

router.get('/years', getYears);
router.get('/sources', getSources);
router.get('/categories', getCategories);
router.get('/income-categories', getIncomeHeads);
router.get('/year/:year', getRuleByYear);
router.get('/:year', getRuleByYear);
router.get('/', getRules);

export default router;
