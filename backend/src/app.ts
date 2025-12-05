import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './logger.js';

export const app = express();

// Health check endpoint MUST be before any middleware that could block it
// Railway's healthcheck comes from hostname "healthcheck.railway.app"
// See: https://docs.railway.com/guides/healthchecks#healthcheck-hostname
app.get('/health', (_req, res) => {
  console.log('Healthcheck hit');
  logger.info('Healthcheck hit');
  res.status(200).send('ok');
});

app.use(
  pinoHttp({
    logger,
  } as any),
);

// CORS Configuration
// Per MDN: When using credentials, you MUST specify explicit origins (not wildcards)
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#credentialed_requests_and_wildcards
const allowedOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and credentials
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests globally (per Express CORS docs)
// https://github.com/expressjs/cors#enabling-cors-pre-flight
app.options('*', cors(corsOptions));

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

