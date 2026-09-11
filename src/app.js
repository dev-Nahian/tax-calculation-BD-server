import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import {
  getYears,
  getRuleByYear,
  getSourcesByYear,
  getSources,
} from './controllers/ruleController.js';
import { calculateTaxEstimate } from './controllers/taxController.js';

const app = express();

// Security and middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Primary API v1 Routes
app.use('/api/v1', apiRoutes);

// Direct Aliased Convenience Routes for NBR Tax Workflow API
app.get('/api/tax-years', getYears);
app.get('/api/tax-years/:year', getRuleByYear);
app.get('/api/tax-rules/:year', getRuleByYear);
app.get('/api/tax-sources/:year', getSourcesByYear);
app.get('/api/tax-sources', getSources);
app.post('/api/tax/calculate', calculateTaxEstimate);
app.post('/api/tax/estimate', calculateTaxEstimate);

// Admin Source & Rule Management API
app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'TaxBD API',
    description: 'Bangladesh Income Tax Calculator & Official NBR Source Governance API',
    version: '2.0.0',
    authority: 'National Board of Revenue (NBR), Bangladesh',
    documentation: '/api/v1/health',
    endpoints: {
      taxYears: '/api/tax-years',
      taxRules: '/api/tax-rules/:year',
      taxSources: '/api/tax-sources/:year',
      adminTaxRules: '/api/admin/tax-rules',
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
