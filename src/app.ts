// src/app.js
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { httpLogger } = require('./middleware/logger.middleware');
const errorMiddleware = require('./middleware/error.middleware');
const notFoundMiddleware = require('./middleware/notFound.middleware');
const triageRoutes = require('./routes/triage.routes');

const app = express();


app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

//  Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logger
app.use(httpLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use(limiter);

interface HealthData {
  status: 'ok';
  timestamp: string;
}

interface HealthResponse {
  success: true;
  data: HealthData;
}

// Health check
app.get('/health', (req: import('express').Request, res: import('express').Response<HealthResponse>) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
app.use(`${env.API_PREFIX}/triage`, triageRoutes);

// 404 + error handlers (MUST be last)
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
