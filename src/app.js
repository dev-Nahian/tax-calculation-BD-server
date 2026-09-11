import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/api.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

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

// API Routes
app.use('/api/v1', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'TaxBD API',
    description: 'Bangladesh Income Tax Calculator Backend API',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
