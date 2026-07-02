// src/middleware/logger.middleware.js
'use strict';
import type{ Request, Response, NextFunction } from 'express';
const pino = require('pino');
const env = require('../config/env');

const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        }
      : undefined,
  base: {
    env: env.NODE_ENV,
    service: 'triage-api',
  },
});

const httpLogger = (req :Request, res :Response, next :NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        durationMs: durationMs.toFixed(2),
      },
      'HTTP request'
    );
  });

  next();
};

export { logger, httpLogger };
