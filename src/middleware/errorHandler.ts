// src/middleware/error.middleware.js
'use strict';

const { z } = require('zod');
const ApiError = require('../utils/apiError');
const { logger } = require('./logger.middleware');

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  // Zod validation errors -> 400
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
  }

  // Operational errors we created ourselves
  if (err instanceof ApiError) {
    logger.warn({ err: err.message, statusCode: err.statusCode }, 'Operational error');
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unexpected / programmer errors
  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  });
};

module.exports = errorMiddleware;
