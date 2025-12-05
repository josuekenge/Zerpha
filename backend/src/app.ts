import express from 'express';
import cors from 'cors';
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

// 4. CORS middleware - after health check
app.use(cors({
  origin: (origin, callback) => {
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
  maxAge: 86400,
}));

// 5. Explicit OPTIONS handler
app.options('*', cors());

// 6. Debug logging for OPTIONS (temporary)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('=== PREFLIGHT REQUEST ===');
    console.log('Origin:', req.headers.origin);
    console.log('Path:', req.path);
    res.on('finish', () => {
      console.log('=== PREFLIGHT RESPONSE ===');
      console.log('Status:', res.statusCode);
      console.log('Access-Control-Allow-Origin:', res.getHeader('access-control-allow-origin'));
    });
  }
  next();
});

// 7. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 8. Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(pinoHttp({ logger } as any));

// 9. API routes
app.use('/api', apiRouter);

// 10. CORS test endpoint (temporary)
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
