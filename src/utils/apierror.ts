// src/utils/apierror.ts

export default class ApiError extends Error {
  public statusCode: number;
  public details: unknown;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    details: unknown = null
  ) {
    super(message);

    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}