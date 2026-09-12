import { errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const notFound = (req, res, next) => {
  errorResponse(res, `Not Found - ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;

  // Log error using privacy-conscious structured logger
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, err);

  // Sanitize error message to prevent database URI, credentials, or internal syntax disclosure
  let clientMessage = err.message || 'Internal Server Error';

  if (isProd) {
    // In production, mask internal MongoDB / Mongoose / Syntax errors
    if (
      statusCode === 500 ||
      clientMessage.includes('Mongo') ||
      clientMessage.includes('E11000') ||
      clientMessage.includes('topology') ||
      clientMessage.includes('connect') ||
      clientMessage.includes('secret')
    ) {
      clientMessage = 'An unexpected internal error occurred. Please try again later.';
    }
  }

  return res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(err.errors && { errors: err.errors }),
    stack: isProd ? null : err.stack,
  });
};
