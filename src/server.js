import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  // Try connecting to MongoDB
  await connectDB();

  const PORT = config.port;
  const server = app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  TaxBD Server running on port ${PORT}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  API Endpoint: http://localhost:${PORT}/api/v1`);
    console.log(`========================================`);
  });

  // Graceful shutdown handlers
  const handleShutdown = () => {
    console.log('\nGracefully shutting down TaxBD server...');
    server.close(() => {
      console.log('Server process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
};

startServer();
