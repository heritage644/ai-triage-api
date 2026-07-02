// src/middleware/notFound.middleware.js
'use strict';
import type{ Request, Response, NextFunction } from 'express';
const ApiError = require('../utils/apiError');

const notFoundMiddleware = (req :Request, res :Response, next :NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export default notFoundMiddleware;
