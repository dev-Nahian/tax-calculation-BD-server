import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

export const registerUser = async (userData) => {
  const { name, email, password, category, zone, tinNumber } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User already exists with this email address');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    category: category || 'general',
    zone: zone || 'dhaka_chattogram',
    tinNumber: tinNumber || null,
  });

  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      category: user.category,
      zone: user.zone,
      tinNumber: user.tinNumber,
    },
    token,
  };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      category: user.category,
      zone: user.zone,
      tinNumber: user.tinNumber,
    },
    token,
  };
};
