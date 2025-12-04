import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';
import { env } from './config/env.js';
export const app = express();
app.use(pinoHttp({
    logger,
}));
// Configure allowed origins for CORS
const allowedOrigins = env.NODE_ENV === 'production'
    ? [
        env.FRONTEND_URL, // Set this in Railway env vars
        'https://zerpha.up.railway.app',
        'https://zerpha.railway.app',
    ].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, origin);
        }
        else {
            logger.warn({ origin, allowedOrigins }, 'CORS blocked origin');
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
