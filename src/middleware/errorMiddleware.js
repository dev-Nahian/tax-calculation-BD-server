import { errorResponse } from '../utils/apiResponse.js';

export const notFound = (req, res, next) => {
  errorResponse(res, `Not Found - ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || 'Internal Server Error';
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
