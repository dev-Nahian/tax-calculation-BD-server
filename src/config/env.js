import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5050,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taxbd',
  jwtSecret: process.env.JWT_SECRET || 'taxbd_super_secret_jwt_key_2026_bd_fintech',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
