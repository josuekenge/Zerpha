import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

// ============================================================
// STEP 1: TRUST PROXY (Railway uses proxies)
// ============================================================
app.set('trust proxy', 1);

// ============================================================
// STEP 2: ALLOWED ORIGINS
// ============================================================
const allowedOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'http://localhost:5173',
  'http://localhost:3000',
];

// ============================================================
// STEP 3: CORS MIDDLEWARE - MUST BE FIRST
// ============================================================
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      console.log('⚠️  Request with no origin header');
      return callback(null, true);
    }

    console.log('🌍 Request from origin:', origin);

    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ Origin blocked:', origin);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
}));

// ============================================================
// STEP 4: EXPLICIT OPTIONS HANDLER - CRITICAL FOR PREFLIGHT
// ============================================================
app.options('*', cors());

// ============================================================
// STEP 5: PREFLIGHT DEBUG LOGGER (TEMPORARY - REMOVE AFTER FIX)
// ============================================================
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('\n==================== PREFLIGHT REQUEST ====================');
    console.log('⏰ Time:', new Date().toISOString());
    console.log('🎯 Path:', req.path);
    console.log('🌍 Origin:', req.headers.origin || 'NO ORIGIN HEADER');
    console.log('📋 Request Method:', req.headers['access-control-request-method']);
    console.log('📋 Request Headers:', req.headers['access-control-request-headers']);

    // Capture response headers when response finishes
    const originalSend = res.send;
    res.send = function (data) {
      console.log('\n==================== PREFLIGHT RESPONSE ====================');
      console.log('📊 Status Code:', res.statusCode);
      console.log('✅ Access-Control-Allow-Origin:', res.getHeader('access-control-allow-origin') || 'MISSING ❌');
      console.log('✅ Access-Control-Allow-Methods:', res.getHeader('access-control-allow-methods') || 'MISSING ❌');
      console.log('✅ Access-Control-Allow-Headers:', res.getHeader('access-control-allow-headers') || 'MISSING ❌');
      console.log('✅ Access-Control-Allow-Credentials:', res.getHeader('access-control-allow-credentials') || 'MISSING ❌');
      console.log('===========================================================\n');
      return originalSend.call(this, data);
    };
  }
  next();
});

// ============================================================
// STEP 6: BODY PARSERS - AFTER CORS
// ============================================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// STEP 7: OTHER MIDDLEWARE - AFTER BODY PARSERS
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

app.use(
  pinoHttp({
    logger,
  } as any),
);

// ============================================================
// STEP 8: HEALTH CHECK (before routes)
// ============================================================
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ============================================================
// STEP 9: TEST ENDPOINT (TEMPORARY - REMOVE AFTER FIX)
// ============================================================
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: '🎉 CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    corsHeaders: {
      'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
      'access-control-allow-credentials': res.getHeader('access-control-allow-credentials'),
      'access-control-allow-methods': res.getHeader('access-control-allow-methods'),
    }
  });
});

// ============================================================
// STEP 10: YOUR EXISTING ROUTES
// ============================================================
app.use('/api', apiRouter);

// Error handlers last
app.use(notFoundHandler);
app.use(errorHandler);
