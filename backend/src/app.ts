import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { apiRouter } from './routes/index.js';

// Create Express app
const app = express();

// Trust proxy (required for Railway)
app.set('trust proxy', 1);

// =============================================================================
// CORS CONFIGURATION - APPLIED FIRST
// =============================================================================
const allowedOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'https://zerpha.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

console.log('🔒 CORS Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
}));

// Handle preflight
app.options('*', cors());

// =============================================================================
// MIDDLEWARE
// =============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helmet - disable things that conflict with CORS
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// =============================================================================
// HEALTH CHECK - Simple endpoint to verify server is running
// =============================================================================
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3001,
  });
});

// =============================================================================
// API ROUTES
// =============================================================================
app.use('/api', apiRouter);

// =============================================================================
// 404 HANDLER
// =============================================================================
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// =============================================================================
// ERROR HANDLER
// =============================================================================
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export { app };
