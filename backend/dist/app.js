import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
export const app = express();
// =============================================================================
// TRUST PROXY (Required for Railway/Heroku)
// =============================================================================
app.set('trust proxy', 1);
// =============================================================================
// CORS CONFIGURATION
// =============================================================================
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
// Build allowed origins list
const buildAllowedOrigins = () => {
    const origins = [];
    // Parse CORS_ORIGIN environment variable (comma-separated)
    if (CORS_ORIGIN) {
        const envOrigins = CORS_ORIGIN.split(',')
            .map((o) => o.trim())
            .filter(Boolean);
        origins.push(...envOrigins);
    }
    // Always include production domains
    const productionDomains = [
        'https://www.zerpha.ca',
        'https://zerpha.ca',
        'https://zerpha.netlify.app',
    ];
    for (const domain of productionDomains) {
        if (!origins.includes(domain)) {
            origins.push(domain);
        }
    }
    // In development, add localhost origins
    if (NODE_ENV !== 'production') {
        const devOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];
        for (const origin of devOrigins) {
            if (!origins.includes(origin)) {
                origins.push(origin);
            }
        }
    }
    return origins;
};
const allowedOrigins = buildAllowedOrigins();
// Log CORS configuration on startup
console.log('');
console.log('🔒 CORS Configuration');
console.log('════════════════════════════════════════');
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log(`   CORS_ORIGIN env: ${CORS_ORIGIN || '(not set)'}`);
console.log(`   Allowed Origins:`);
allowedOrigins.forEach((origin, i) => console.log(`     ${i + 1}. ${origin}`));
console.log('════════════════════════════════════════');
console.log('');
// CORS middleware configuration
const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Log blocked origin for debugging
        console.error(`❌ [CORS] Blocked request from: ${origin}`);
        console.error(`   Allowed origins: ${allowedOrigins.join(', ')}`);
        // Return error with helpful message
        const error = new Error(`CORS policy: Origin ${origin} is not allowed`);
        return callback(error, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 hours
});
// Apply CORS FIRST, before any other middleware
app.use(corsMiddleware);
// Handle preflight requests for all routes
app.options('*', corsMiddleware);
// =============================================================================
// BODY PARSERS
// =============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// =============================================================================
// SECURITY HEADERS (Helmet - configured to not interfere with CORS)
// =============================================================================
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable CSP for API server
}));
// =============================================================================
// REQUEST LOGGING
// =============================================================================
app.use(pinoHttp());
// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
    });
});
// =============================================================================
// API ROUTES
// =============================================================================
app.use('/api', apiRouter);
// =============================================================================
// ERROR HANDLING
// =============================================================================
app.use(notFoundHandler);
// Global error handler
app.use((err, req, res, _next) => {
    // Log the error
    console.error('🚨 Unhandled Error:', err.message);
    console.error('   Path:', req.path);
    console.error('   Method:', req.method);
    // Check if it's a CORS error
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS Error',
            message: err.message,
            allowedOrigins,
        });
    }
    // Use the custom error handler
    errorHandler(err, req, res, _next);
});
