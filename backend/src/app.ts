import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { apiRouter } from './routes/index.js';

const app = express();

// Trust proxy (Railway, Heroku, etc.)
app.set('trust proxy', 1);

// ============ CORS - SIMPLE ============
// This handles all CORS including OPTIONS preflight
app.use(cors());

// ============ MIDDLEWARE ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// ============ HEALTH CHECK ============
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3001,
  });
});

// ============ API ROUTES ============
app.use('/api', apiRouter);

// ============ 404 ============
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============ ERROR HANDLER ============
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export { app };