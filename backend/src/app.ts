import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

console.log('🔥 CORS FIX v3 - OPTIONS ROUTE HANDLER 🔥');

// Trust proxy for Railway
app.set('trust proxy', 1);

// HANDLE ALL OPTIONS REQUESTS FIRST - BEFORE ANYTHING ELSE
app.options('*', (req, res) => {
  const allowedOrigins = [
    'https://www.zerpha.ca',
    'https://zerpha.ca',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin;
  console.log('OPTIONS request received from:', origin);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// CORS middleware for non-OPTIONS requests
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://www.zerpha.ca',
    'https://zerpha.ca',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  next();
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

// API routes
app.use('/api', apiRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);
