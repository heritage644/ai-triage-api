// src/utils/asyncHandler.js
'use strict';

/**
 * Wraps an async Express middleware/controller so that any thrown error
 * is automatically forwarded to the Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
