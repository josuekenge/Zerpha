import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

// Health check endpoint MUST be first and before ALL middleware
// v2 - Dec 4 2025
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// CORS MUST be the very first middleware after health check
// CRITICAL: Must come BEFORE helmet, body parsers, and logging
const allowedOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'http://localhost:5173',
  'http://localhost:3000',
];

// DEBUG: Log all OPTIONS requests to verify they reach the server
app.use((req, _res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS hit', req.path, 'origin:', req.headers.origin);
  }
  next();
});

// Simplified CORS - let the library handle it properly
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false, // Let CORS middleware handle preflight fully
  }),
);

// NOW apply other middleware AFTER CORS is set up
app.use(
  pinoHttp({
    logger,
  } as any),
);

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRouter);

// Error handlers last
app.use(notFoundHandler);
app.use(errorHandler);
