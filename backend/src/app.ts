import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

// Trust proxy - required for Railway's edge proxy
app.set('trust proxy', 1);

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

// CORS options with callback form for Railway
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// CORS middleware - must be first middleware after /health
app.use(cors(corsOptions));

// Explicit OPTIONS handler for preflight - required for Railway
app.options('*', cors(corsOptions));

// Body parsers - AFTER CORS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Other middleware
app.use(pinoHttp({ logger } as any));
app.use(helmet());

// API routes
app.use('/api', apiRouter);

// Error handlers last
app.use(notFoundHandler);
app.use(errorHandler);
