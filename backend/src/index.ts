import cors from 'cors';
import { app } from './app';
import { verifySupabaseConnection } from './config/supabase.js';
import { logger } from './logger.js';

const allowedOrigins = [
  'https://www.zerpha.ca',
  'https://zerpha.ca',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.options('*', cors());

// Health check endpoint for Railway
app.get('/health', (_req, res) => {
  res.status(200).send({ status: 'ok' });
});

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  logger.info(`Server listening on port ${PORT}`);
});

// Run Supabase verification asynchronously so it never blocks startup
verifySupabaseConnection()
  .then(() => {
    console.log('✅ Supabase connection verified');
  })
  .catch((error) => {
    console.warn('⚠ Supabase verification failed (continuing):', error);
  });

// Graceful shutdown handlers
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));