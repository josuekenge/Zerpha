import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

// STEP 1: Trust proxy for Railway
app.set('trust proxy', 1);

// Health check endpoint - stays here for Railway
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// STEP 2: Define allowed origins
const allowedOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'http://localhost:5173',
  'http://localhost:3000',
];

// STEP 3: CORS middleware - MUST BE FIRST (before any other middleware except trust proxy)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours - cache preflight for 1 day
}));

// STEP 4: Explicit OPTIONS handler for all routes
app.options('*', cors());

// STEP 5: Add temporary debugging middleware (remove after verification)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('=== PREFLIGHT REQUEST ===');
    console.log('Origin:', req.headers.origin);
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Access-Control-Request-Method:', req.headers['access-control-request-method']);
    console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers']);

    // Log response headers after they're set
    res.on('finish', () => {
      console.log('=== PREFLIGHT RESPONSE ===');
      console.log('Status:', res.statusCode);
      console.log('Access-Control-Allow-Origin:', res.getHeader('access-control-allow-origin'));
      console.log('Access-Control-Allow-Methods:', res.getHeader('access-control-allow-methods'));
      console.log('Access-Control-Allow-Headers:', res.getHeader('access-control-allow-headers'));
      console.log('Access-Control-Allow-Credentials:', res.getHeader('access-control-allow-credentials'));
    });
  }
  next();
});

// STEP 6: Body parsers MUST come AFTER CORS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// STEP 7: Other middleware (helmet, logging, etc.) comes AFTER body parsers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(
  pinoHttp({
    logger,
  } as any),
);

// STEP 8: API routes
app.use('/api', apiRouter);

// Temporary CORS testing endpoint - remove after verification
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    corsHeaders: {
      'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
      'access-control-allow-credentials': res.getHeader('access-control-allow-credentials'),
    }
  });
});

// Error handlers last
app.use(notFoundHandler);
app.use(errorHandler);
