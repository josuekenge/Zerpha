import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Note: If you get a "Cannot find module" error, try removing the .js extension
// depending on your tsconfig.json settings.
import { apiRouter } from './routes/index.js';

// Create Express app
const app = express();

// Trust proxy (required for Railway to pass correct IP/Protocol)
app.set('trust proxy', 1);

// =============================================================================
// CORS CONFIGURATION
// =============================================================================
// 
// For production, set CORS_ORIGIN in Railway:
//   CORS_ORIGIN=https://www.zerpha.ca,https://zerpha.ca,https://zerpha.netlify.app
//
// For local development, localhost origins are included by default.
// =============================================================================

// Parse CORS_ORIGIN from environment (comma-separated list)
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [];

// Default allowed origins (always include these for safety)
const defaultOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'https://zerpha.netlify.app',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Fallback dev server
];

// Combine env origins with defaults (env takes precedence if set)
const allowedOrigins = envOrigins.length > 0
  ? [...new Set([...envOrigins, ...defaultOrigins])]  // Merge and dedupe
  : defaultOrigins;

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(`🚫 CORS blocked request from: ${origin}`);
    console.error(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Required for cookies/authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
};

console.log('🔒 CORS Configured for:', allowedOrigins);

// 1. Apply CORS to all routes
app.use(cors(corsOptions));

// 2. Handle Preflight (OPTIONS) requests explicitly using the SAME options
app.options('*', cors(corsOptions));

// =============================================================================
// MIDDLEWARE
// =============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helmet - Security headers that don't break CORS
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    // This just reports the port, doesn't set it. index.ts sets the listener.
    port: process.env.PORT || 3001,
  });
});

// =============================================================================
// API ROUTES
// =============================================================================
app.use('/api', apiRouter);

// =============================================================================
// ERROR HANDLERS
// =============================================================================
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export { app };