import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// In production, ensure strong JWT secret is configured
const jwtSecret = process.env.JWT_SECRET || 'taxbd_super_secret_jwt_key_2026_bd_fintech';
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'taxbd_super_secret_jwt_key_2026_bd_fintech')) {
  console.warn('[SECURITY WARNING] Running in production with default or unconfigured JWT_SECRET. Please set a secure JWT_SECRET.');
}

const parseAllowedOrigins = (clientUrlEnv) => {
  if (!clientUrlEnv) {
    return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
  }
  return clientUrlEnv.split(',').map((url) => url.trim());
};

export const config = {
  port: parseInt(process.env.PORT, 10) || 5050,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taxbd',
  jwtSecret,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: parseAllowedOrigins(process.env.CLIENT_URL),
};

export default config;
