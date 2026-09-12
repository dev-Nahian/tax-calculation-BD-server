import { registerUser, loginUser } from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    return successResponse(res, 'User registered successfully', result, 201);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    return successResponse(res, 'Login successful', result);
  } catch (error) {
    logger.authFailure({
      email: req.body?.email,
      ip: req.ip,
      reason: error.message,
    });

    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 'Current user profile retrieved', {
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        category: req.user.category,
        zone: req.user.zone,
        tinNumber: req.user.tinNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
