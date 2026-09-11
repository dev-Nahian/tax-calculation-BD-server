import { verifyToken } from '../utils/generateToken.js';
import { errorResponse } from '../utils/apiResponse.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'Not authorized, no authentication token provided', 401);
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse(res, 'Not authorized, invalid or expired token', 401);
    }

    try {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      } else {
        req.user = { _id: decoded.id, role: decoded.role || 'user' };
      }
    } catch {
      req.user = { _id: decoded.id, role: decoded.role || 'user' };
    }

    next();
  } catch (error) {
    return errorResponse(res, 'Token verification failed', 401);
  }
};
