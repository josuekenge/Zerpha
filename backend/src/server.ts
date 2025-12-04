import { app } from './app.js';
import { verifySupabaseConnection } from './config/supabase.js';
import { logger } from './logger.js';

async function bootstrap() {
  // Start server FIRST so health checks pass while we initialize
  const port = process.env.PORT || 3001;
  
  const server = app.listen(Number(port), '0.0.0.0', () => {
    console.log(`🚀 Backend ready on http://0.0.0.0:${port}`);
    logger.info(`🚀 Backend ready on http://0.0.0.0:${port}`);
  });

  // Verify Supabase connection after server is up
  try {
    await verifySupabaseConnection();
    console.log('✅ Supabase connection verified');
  } catch (err) {
    console.warn('⚠️ Supabase connection check failed, continuing anyway:', err);
  }

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, closing server...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('❌ Failed to bootstrap application:', error);
  logger.error({ err: error }, 'Failed to bootstrap application');
  process.exit(1);
});
