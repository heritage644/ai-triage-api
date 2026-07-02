// src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import ApiError from "../utils/apierror";
import { logger } from "./logger.middleare";

interface ErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  details?: unknown;
}

const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): Response | void => {
  // Prevent TypeScript warning about unused parameter
  void req;
  void next;

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
  }

  // Custom operational errors
  if (err instanceof ApiError) {
    logger.warn(
      {
        err: err.message,
        statusCode: err.statusCode,
      },
      "Operational error"
    );

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unknown errors
  logger.error({ err }, "Unhandled error");

  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
      ? err.message
      : "Internal server error";

  return res.status(500).json({
    success: false,
    message,
  });
};

export default errorMiddleware;