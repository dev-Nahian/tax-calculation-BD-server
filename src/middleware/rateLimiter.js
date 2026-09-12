import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter: 200 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.',
  },
});

/**
 * Strict authentication limiter (login/register): 15 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address, please try again in 15 minutes.',
  },
});

/**
 * Tax Calculation limiter: 60 requests per minute per IP
 */
export const taxCalculationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Tax calculation rate limit exceeded. Please wait a moment before trying again.',
  },
});

/**
 * Admin actions limiter: 40 requests per 5 minutes
 */
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Administrative request limit exceeded. Please wait a few minutes.',
  },
});
