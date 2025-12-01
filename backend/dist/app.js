import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';
export const app = express();
app.use(pinoHttp({
    logger,
}));
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
