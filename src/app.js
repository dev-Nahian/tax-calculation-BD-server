import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/adminRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { mongoSanitize } from './middleware/sanitizeMiddleware.js';
import { apiLimiter, taxCalculationLimiter } from './middleware/rateLimiter.js';
import { taxEstimateValidationRules } from './validators/taxValidator.js';
import { validateRequest } from './middleware/validationMiddleware.js';
import {
  getYears,
  getRuleByYear,
  getSourcesByYear,
  getSources,
} from './controllers/ruleController.js';
import {
  calculateTaxEstimate,
  getUserTaxHistory,
  deleteTaxHistoryRecord,
  clearAllTaxHistory,
  getPrivacyPolicy,
} from './controllers/taxController.js';
import { protect } from './middleware/authMiddleware.js';

const app = express();

// 1. Trust proxy when behind reverse proxies (for rate-limiting client IP resolution)
app.set('trust proxy', 1);

// 2. HTTP Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 3. Strict CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser / server-to-server requests (no origin) or whitelisted origins
    if (!origin || config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Access denied for this origin.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours preflight cache
};
app.use(cors(corsOptions));

// 4. Request Body Size Limits (Mitigates DoS via oversized payloads)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. MongoDB Operator Injection & Input Sanitization
app.use(mongoSanitize);

// 6. Global Rate Limiter
app.use('/api', apiLimiter);

// 7. Request Logging (Skipped in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 8. Primary API v1 Routes
app.use('/api/v1', apiRoutes);

// 9. Direct Aliased Convenience Routes for NBR Tax Workflow API
app.get('/api/tax-years', getYears);
app.get('/api/tax-years/:year', getRuleByYear);
app.get('/api/tax-rules/:year', getRuleByYear);
app.get('/api/tax-sources/:year', getSourcesByYear);
app.get('/api/tax-sources', getSources);
app.use('/api/auth', authRoutes);

app.post(
  '/api/tax/calculate',
  taxCalculationLimiter,
  taxEstimateValidationRules,
  validateRequest,
  calculateTaxEstimate
);
app.post(
  '/api/tax/estimate',
  taxCalculationLimiter,
  taxEstimateValidationRules,
  validateRequest,
  calculateTaxEstimate
);

app.get('/api/tax/privacy', getPrivacyPolicy);
app.get('/api/tax/history', protect, getUserTaxHistory);
app.delete('/api/tax/history/:id', protect, deleteTaxHistoryRecord);
app.delete('/api/tax/history', protect, clearAllTaxHistory);

// 10. Admin Source & Rule Management API (RBAC & Auth Protected)
app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);

// 11. Root status route (No sensitive details exposed)
app.get('/', (req, res) => {
  res.json({
    name: 'TaxBD API',
    description: 'Bangladesh Personal Income Tax Calculator & Official NBR Source Governance API',
    version: '2.1.0',
    status: 'online',
    authority: 'National Board of Revenue (NBR), Bangladesh',
    compliance: 'Income Tax Act 2023 & Finance Act 2024',
    endpoints: {
      taxYears: '/api/tax-years',
      taxRules: '/api/tax-rules/:year',
      calculateTax: '/api/tax/calculate',
      privacyPolicy: '/api/tax/privacy',
    },
  });
});

// 12. 404 & Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
