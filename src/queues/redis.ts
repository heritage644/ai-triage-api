// src/queues/redis.ts

import IORedis, { Redis } from "ioredis";
import env from "../config/env";
import { logger } from "../middleware/logger.middleare";

export const createRedisConnection = (): Redis => {
  const redis = new IORedis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,

    // Required by Bull
    maxRetriesPerRequest: null,
    enableReadyCheck: false,

    retryStrategy: (times: number): number => {
      return Math.min(times * 200, 5000);
    },
  });

  redis.on("connect", () => {
    logger.info("Redis connected");
  });

  redis.on("error", (err: Error) => {
    logger.error(
      {
        err,
      },
      "Redis connection error"
    );
  });

  return redis;
};