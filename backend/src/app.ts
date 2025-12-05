import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

// 1. Trust proxy for Railway
app.set('trust proxy', 1);

// 2. Health check - MUST BE FIRST, before any middleware
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Define allowed origins
const allowedOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'http://localhost:5173',
  'http://localhost:3000',
];

// 4. MANUAL CORS middleware - guaranteed to set headers
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Always set these headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('=== PREFLIGHT ===', req.path, 'Origin:', origin);
    res.status(200).end();
    return;
  }

  next();
});

// 5. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(pinoHttp({ logger } as any));

// 7. API routes
app.use('/api', apiRouter);

// 8. CORS test endpoint (temporary)
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

// Error handlers last
app.use(notFoundHandler);
app.use(errorHandler);
