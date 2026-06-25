// src/database/prisma.js
'use strict';

const { PrismaClient } = require('@prisma/client');
const { logger } = require('../middleware/logger.middleware');

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });
};

// Reuse the same client in dev hot-reload
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

prisma.$on('warn', (e) => logger.warn({ prisma: e }, 'Prisma warning'));
prisma.$on('error', (e) => logger.error({ prisma: e }, 'Prisma error'));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
