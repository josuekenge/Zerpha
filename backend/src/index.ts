import express from 'express';

import { app as legacyApp } from './app.js';
import { verifySupabaseConnection } from './config/supabase.js';
import { logger } from './logger.js';

const server = express();

// Root-level health endpoint for Railway
server.get('/health', (_req, res) => {
  console.log('Healthcheck hit');
  logger.info('Healthcheck hit');
  res.status(200).send('ok');
});

// Mount the existing application (routes, middleware, etc.)
server.use(legacyApp);

const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, '0.0.0.0', () => {
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

