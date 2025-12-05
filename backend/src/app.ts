import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

console.log('🔥 CORS FIX v2 - NEW BUILD DEPLOYED 🔥');

// Trust proxy for Railway
app.set('trust proxy', 1);

// ============================================================
// MANUAL CORS HANDLER - FIXES PREFLIGHT ACCESS-CONTROL ISSUE
// ============================================================
app.use((req, res, next) => {
  // List of allowed origins
  const allowedOrigins = [
    'https://www.zerpha.ca',
    'https://zerpha.ca',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  // Get the request origin
  const origin = req.headers.origin;

  // Check if origin is allowed and set header
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Set other CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('CORS Preflight request from:', origin);
    return res.status(204).end();
  }

  // Continue to next middleware
  next();
});
// ============================================================

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet (with CORS-friendly config)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Logging
app.use(pinoHttp({ logger } as any));

// Your routes
app.use('/api', apiRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);
