import { successResponse } from '../utils/apiResponse.js';
import { getDBStatus } from '../config/db.js';

export const getHealthStatus = (req, res) => {
  const dbStatus = getDBStatus();
  return successResponse(res, 'TaxBD API is active and healthy', {
    status: 'online',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
};
