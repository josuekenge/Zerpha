import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

app.set('trust proxy', 1);

// Health check - FIRST, before any middleware
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MANUAL CORS - NO LIBRARY NEEDED
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

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Body parsers AFTER CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(pinoHttp({ logger } as any));

// API routes
app.use('/api', apiRouter);

// CORS test endpoint
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
