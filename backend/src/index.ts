import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { initMeiliSearch } from './lib/meilisearch';
import { logger, log } from './utils/logger';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  const app = createApp();

  // Initialize Meilisearch
  try {
    await initMeiliSearch();
    log.info('Meilisearch initialized successfully');
  } catch (error) {
    log.warn('Failed to initialize Meilisearch (continuing anyway)', { error });
  }

  // Start server
  const server = app.listen(PORT, () => {
    log.info(`Server started`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      url: `http://localhost:${PORT}`,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    log.info(`Received ${signal}, shutting down gracefully...`);

    server.close(() => {
      log.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      log.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection', { reason, promise: String(promise) });
  });
}

startServer();
