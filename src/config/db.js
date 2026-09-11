import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${config.mongoUri}: ${error.message}`);
    console.warn(`[MongoDB Notice] Server is running in resilient mode. Rules and calculations will use in-memory seed data fallback.`);
  }
};

export const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || 'none',
});
