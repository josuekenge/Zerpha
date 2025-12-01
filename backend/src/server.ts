import { app } from './app.js';
import { env } from './config/env.js';
import { verifySupabaseConnection } from './config/supabase.js';
import { logger } from './logger.js';

async function bootstrap() {
  await verifySupabaseConnection();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Backend ready on http://localhost:${env.PORT}`);
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

