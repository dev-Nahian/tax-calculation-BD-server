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
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply Authentication, RBAC (admin/super_admin/tax_officer) and Rate Limiter to ALL admin routes
router.use(protect);
router.use(adminOnly);
router.use(adminLimiter);

// Dashboard Overview & Rules Management
router.get('/overview', getAdminOverview);
router.get('/tax-rules', getAdminOverview);
router.get('/tax-years', getTaxYearsList);
router.patch('/tax-rules/:year/status', updateStatus);
router.post('/tax-rules/:year/verify', verifyRules);

// Specific Entity Endpoints
router.get('/slabs', getTaxSlabsList);
router.post('/slabs', saveTaxSlab);

router.get('/sources', getTaxSourcesList);
router.post('/sources', saveTaxSource);

router.get('/rebates', getRebatesList);
router.get('/minimum-tax', getMinimumTaxesList);
router.get('/surcharge', getSurchargeList);

router.get('/calculations', getCalculationsAuditList);
router.get('/users', getAdminUsersList);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
