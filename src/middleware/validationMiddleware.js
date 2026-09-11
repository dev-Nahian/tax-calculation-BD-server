import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/apiResponse.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return errorResponse(res, 'Validation failed', 422, formattedErrors);
  }
  next();
};
