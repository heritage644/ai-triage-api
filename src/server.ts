// src/server.ts

import app from "./app";
import env from "./config/env";
import prisma from "./database/prisma";
import { logger } from "./middleware/logger.middleware";
import { Server } from "http";

const start = async (): Promise<void> => {
  try {
    // Validate DB connectivity at boot
    await prisma.$connect();
    logger.info("Database connection established");

    const server: Server = app.listen(env.PORT, () => {
      logger.info(
        `Server listening on port ${env.PORT} (env=${env.NODE_ENV})`
      );
    });

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await prisma.$disconnect();
          logger.info("Database disconnected");
          logger.info("Server closed");
          process.exit(0);
        } catch (err) {
          logger.error({ err }, "Error during shutdown");
          process.exit(1);
        }
      });

      // Force exit after 10 seconds if shutdown hangs
      setTimeout(() => {
        logger.error(
          "Forced shutdown. Some connections did not close in time."
        );
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error({ reason }, "Unhandled Promise Rejection");
    });

    process.on("uncaughtException", (err: Error) => {
      logger.error({ err }, "Uncaught Exception");
      process.exit(1);
    });
  } catch (err: unknown) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
};

void start();