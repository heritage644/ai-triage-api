// src/middleware/logger.middleware.ts

import pino, { Logger } from "pino";
import { Request, Response, NextFunction } from "express";
import env from "../config/env";

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
  base: {
    env: env.NODE_ENV,
    service: "triage-api",
  },
});

export const httpLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs =
      Number(process.hrtime.bigint() - start) / 1_000_000;

    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        durationMs: Number(durationMs.toFixed(2)),
      },
      "HTTP request"
    );
  });

  next();
};