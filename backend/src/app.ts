import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

// Health check - first, before any middleware
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// Allowed origins for CORS
const allowedOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'http://localhost:5173',
  'http://localhost:3000',
];

// CORS middleware - must be first middleware after /health
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  }),
);

// Other middleware in order
app.use(pinoHttp({ logger } as any));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRouter);

// Error handlers last
app.use(notFoundHandler);
app.use(errorHandler);
