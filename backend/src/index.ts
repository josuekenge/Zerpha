import { app } from './app.js';
import { verifySupabaseConnection } from './config/supabase.js';
import { logger } from './logger.js';

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  logger.info(`Server listening on port ${PORT}`);
});

// Run Supabase verification asynchronously
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