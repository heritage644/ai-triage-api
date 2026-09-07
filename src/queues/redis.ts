import IORedis, { Redis } from "ioredis";
import env from "../config/env";
import { logger } from "../middleware/logger.middleare";

export const createRedisConnection = (): Redis => {
  const redis = new IORedis(env.REDIS_URL, {
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
    logger.error({ err }, "Redis connection error");
  });

  return redis;
};