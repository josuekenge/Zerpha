import { app } from './app.js';
import { env } from './config/env.js';
import { verifySupabaseConnection } from './config/supabase.js';
import { logger } from './logger.js';

async function bootstrap() {
  await verifySupabaseConnection();

  // Railway provides PORT env var - bind to 0.0.0.0 for external access
  const port = process.env.PORT || env.PORT;
  const server = app.listen(Number(port), '0.0.0.0', () => {
    logger.info(`🚀 Backend ready on http://0.0.0.0:${port}`);
  });

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
  logger.error({ err: error }, 'Failed to bootstrap application');
  process.exit(1);
});

