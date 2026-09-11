import { registerUser, loginUser } from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import User from '../models/User.js';

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
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 'Current user profile retrieved', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
