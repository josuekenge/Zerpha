import express from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

console.log('🔥 CORS SUPER SIMPLE TEST 🔥');

// Trust Railway proxy
app.set('trust proxy', 1);

// Very permissive CORS for debugging
const corsOptions: CorsOptions = {
  // Reflect the request Origin header, whatever it is
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// CORS must run before body parsers, helmet, logging, or routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// Logging
app.use(pinoHttp({ logger } as any));

// API routes
app.use('/api', apiRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);
