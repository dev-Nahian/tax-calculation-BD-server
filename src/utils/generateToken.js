import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: String(userId), role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
};
