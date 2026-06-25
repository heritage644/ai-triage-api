// src/middleware/notFound.middleware.js
'use strict';

const ApiError = require('../utils/apiError');

const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

module.exports = notFoundMiddleware;
