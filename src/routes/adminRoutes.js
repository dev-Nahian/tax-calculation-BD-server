import express from 'express';
import {
  getAdminOverview,
  getTaxYearsList,
  updateStatus,
  verifyRules,
  getTaxSlabsList,
  saveTaxSlab,
  getTaxSourcesList,
  saveTaxSource,
  getRebatesList,
  getMinimumTaxesList,
  getSurchargeList,
  getCalculationsAuditList,
  getAdminUsersList,
  getAdminAuditLogs,
} from '../controllers/adminRuleController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Protected Overview & Rules
router.get('/overview', getAdminOverview);
router.get('/tax-rules', getAdminOverview);
router.get('/tax-years', getTaxYearsList);
router.patch('/tax-rules/:year/status', updateStatus);
router.post('/tax-rules/:year/verify', verifyRules);

// Specific Entity Endpoints
router.get('/slabs', getTaxSlabsList);
router.post('/slabs', protect, adminOnly, saveTaxSlab);

router.get('/sources', getTaxSourcesList);
router.post('/sources', protect, adminOnly, saveTaxSource);

router.get('/rebates', getRebatesList);
router.get('/minimum-tax', getMinimumTaxesList);
router.get('/surcharge', getSurchargeList);

router.get('/calculations', protect, adminOnly, getCalculationsAuditList);
router.get('/users', protect, adminOnly, getAdminUsersList);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
