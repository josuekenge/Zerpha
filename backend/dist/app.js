import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
export const app = express();
// Trust proxy for Railway/Heroku deployments
app.set('trust proxy', 1);
// Build allowed origins from environment variable
const buildAllowedOrigins = () => {
    const origins = [];
    // Add CORS_ORIGIN from environment (comma-separated for multiple origins)
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin) {
        const envOrigins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
        origins.push(...envOrigins);
    }
    // In development, also allow localhost
    if (process.env.NODE_ENV !== 'production') {
        origins.push('http://localhost:5173', 'http://localhost:3000');
    }
    return origins;
};
const allowedOrigins = buildAllowedOrigins();
// Log allowed origins on startup
console.log('🔒 CORS Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Allowed Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '(none - all blocked)'}`);
const corsOptions = {
    origin(origin, callback) {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Log blocked origins for debugging
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 204,
    maxAge: 86400,
};
// CORS must be first
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// Request logging - use pinoHttp without passing logger to avoid type conflicts
app.use(pinoHttp());
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api', apiRouter);
// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
