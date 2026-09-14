import mongoose from 'mongoose';
import { config } from './env.js';
import { defaultRulesData } from '../seed/seedRules.js';
import TaxRule from '../models/TaxRule.js';
import User from '../models/User.js';

let isConnected = false;

const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/:[^:@]+@/, ':****@');
};

export const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-seed initial tax rules if database is empty
    try {
      const count = await TaxRule.countDocuments();
      if (count === 0) {
        await TaxRule.insertMany(defaultRulesData);
        console.log(`[MongoDB] Auto-seeded ${defaultRulesData.length} statutory tax rules.`);
      }
    } catch (seedErr) {
      console.warn(`[MongoDB Seed Notice] ${seedErr.message}`);
    }

    // Auto-seed default Administrator and test User if not exists
    try {
      const adminExists = await User.findOne({ email: 'admin@taxbd.gov.bd' });
      if (!adminExists) {
        await User.create({
          name: 'Chief Tax Policy Administrator',
          email: 'admin@taxbd.gov.bd',
          password: 'Admin@TaxBD2026#',
          role: 'admin',
          category: 'general',
          zone: 'dhaka_chattogram',
        });
        console.log(`[MongoDB] Auto-seeded default administrator account: admin@taxbd.gov.bd`);
      }

      const standardUserExists = await User.findOne({ email: 'taxpayer@gmail.com' });
      if (!standardUserExists) {
        await User.create({
          name: 'Rafiqul Islam (Standard Taxpayer)',
          email: 'taxpayer@gmail.com',
          password: 'TaxPayer@2026',
          role: 'user',
          category: 'general',
          zone: 'dhaka_chattogram',
        });
        console.log(`[MongoDB] Auto-seeded standard taxpayer user account: taxpayer@gmail.com`);
      }
    } catch (userErr) {
      console.warn(`[MongoDB User Seed Notice] ${userErr.message}`);
    }
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${sanitizeMongoUri(config.mongoUri)}: ${error.message}`);
    console.warn(`[MongoDB Notice] Server is running in resilient mode. Rules and calculations will use in-memory seed data fallback.`);
  }
};

export const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || 'none',
  name: mongoose.connection.name || 'none',
});
