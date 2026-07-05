// src/app.ts

import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import env from "./config/env";
import { httpLogger } from "./middleware/logger.middleare";
import errorMiddleware from "./middleware/errorHandler";
import notFoundMiddleware from "./middleware/notfound.errr";
import triageRoutes from "./routes/triage.routes";

const app = express();

// Trust reverse proxy (e.g., Docker, Nginx)
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin:
      env.CORS_ORIGIN 
        ? true
        : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// HTTP request logger
app.use(httpLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(limiter);

interface HealthData {
  status: "ok";
  timestamp: string;
}

interface HealthResponse {
  success: true;
  data: HealthData;
}

// Health check endpoint
app.get(
  "/health",
  (
    req: Request,
    res: Response<HealthResponse>
  ): void => {
    res.json({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    });
  }
);

// API routes
app.use(`${env.API_PREFIX}/triage`, triageRoutes);

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

export default app;