// src/middleware/notFound.middleware.ts
'use strict';
import type{ Request, Response, NextFunction } from 'express';
import  ApiError from '../utils/apierror';

const notFoundMiddleware = (req :Request, res :Response, next :NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export default notFoundMiddleware;
