// src/config/env.ts

import { z } from "zod";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  API_PREFIX: z.string().default("/api"),

  DATABASE_URL: z.string().url(),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  CORS_ORIGIN: z.string().default("http://localhost:8080"),

  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

GEMINI_API_KEY: z.string().min(10),
GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
AI_TIMEOUT_MS: z.coerce
  .number()
  .int()
  .positive()
  .default(30000),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[ENV] Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

const env = Object.freeze(parsed.data);

export default env;