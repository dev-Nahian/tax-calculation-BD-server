import express from 'express';
import { getRules, getRuleByYear } from '../controllers/ruleController.js';

const router = express.Router();

router.get('/', getRules);
router.get('/:year', getRuleByYear);

export default router;
