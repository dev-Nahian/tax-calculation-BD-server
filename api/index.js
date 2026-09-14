import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.warn('MongoDB serverless connection warning:', error.message);
    }
  }
  return app(req, res);
}
