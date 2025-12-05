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
    // Fallback: always allow zerpha.ca domains in production for safety
    if (process.env.NODE_ENV === 'production') {
        const productionOrigins = [
            'https://www.zerpha.ca',
            'https://zerpha.ca',
            'https://zerpha.netlify.app',
        ];
        for (const origin of productionOrigins) {
            if (!origins.includes(origin)) {
                origins.push(origin);
            }
        }
    }
    return origins;
};
const allowedOrigins = buildAllowedOrigins();
// Log allowed origins on startup
console.log('🔒 CORS Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   CORS_ORIGIN env: ${process.env.CORS_ORIGIN || '(not set)'}`);
console.log(`   Allowed Origins: ${allowedOrigins.join(', ')}`);
// Simple CORS setup - allow all origins in the list
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}));
// Handle preflight requests explicitly
app.options('*', cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200,
}));
// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Security headers - configured to not interfere with CORS
app.use(helmet({
    crossOriginResourcePolicy: false, // Disable - we handle this ourselves
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
// Request logging
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
