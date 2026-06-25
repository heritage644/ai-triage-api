// src/queues/redis.js
'use strict';

const IORedis = require('ioredis');
const env = require('../config/env');
const { logger } = require('../middleware/logger.middleware');

const createRedisConnection = () => {
  const redis = new IORedis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // required by Bull
    enableReadyCheck: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
  redis.on('connect', () => logger.info('Redis connected'));
  return redis;
};

module.exports = { createRedisConnection };
