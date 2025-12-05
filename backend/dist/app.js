import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';
export const app = express();
console.log('🔥 CORS FIX v4 - Using cors package correctly 🔥');
// Trust Railway proxy
app.set('trust proxy', 1);
const allowedOrigins = [
    'https://www.zerpha.ca',
    'https://zerpha.ca',
    'http://localhost:5173',
    'http://localhost:3000',
];
const corsOptions = {
    origin(origin, callback) {
        // Allow tools like curl or Postman which send no Origin
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Block everything else without throwing
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 204,
};
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// CORS must run before body parsers, helmet, logging, or routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// Logging
app.use(pinoHttp({ logger }));
// API routes
app.use('/api', apiRouter);
// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);
