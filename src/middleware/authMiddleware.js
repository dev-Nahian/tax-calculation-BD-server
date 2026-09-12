import { verifyToken } from '../utils/generateToken.js';
import { errorResponse } from '../utils/apiResponse.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'Not authorized, no authentication token provided', 401);
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return errorResponse(res, 'Not authorized, invalid or expired token', 401);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } catch (err) {
        // Continue to fallback decoded payload if db error
      }
    }

    // Set user context from verified JWT payload
    req.user = {
      _id: decoded.id,
      role: decoded.role || 'user',
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Token verification failed', 401);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied. You do not have permission to perform this action.', 403);
    }
    next();
  };
};

export const adminOnly = restrictTo('admin', 'super_admin', 'tax_officer');
