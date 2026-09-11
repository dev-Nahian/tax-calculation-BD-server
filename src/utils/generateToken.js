import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};
