// src/server.js
'use strict';

const app = require('./app');
const env = require('./config/env');
const prisma = require('./database/prisma');
const { logger } = require('./middleware/logger.middleware');

const start = async () => {
  try {
    // Validate DB connectivity at boot
    await prisma.$connect();
    logger.info('Database connection established');

    const server = app.listen(env.PORT, () => {
      logger.info(
        `Server listening on port ${env.PORT} (env=${env.NODE_ENV})`
      );
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server closed');
        process.exit(0);
      });

      // Force-exit after 10s if something hangs
      setTimeout(() => {
        logger.error('Forced shutdown — some connections did not close in time');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled rejection');
    });
    process.on('uncaughtException', (err) => {
      logger.error({ err }, 'Uncaught exception');
      process.exit(1);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start();
