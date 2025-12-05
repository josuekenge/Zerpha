import { app } from './app.js';
import { verifySupabaseConnection } from './config/supabase.js';
import { logger } from './logger.js';

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================
const PORT = Number(process.env.PORT) || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    🚀 ZERPHA BACKEND SERVER');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Port: ${PORT}`);
console.log('');

// =============================================================================
// START SERVER
// =============================================================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server listening on http://0.0.0.0:${PORT}`);
  logger.info(`Server listening on port ${PORT}`);
});

// =============================================================================
// SUPABASE CONNECTION VERIFICATION
// =============================================================================
verifySupabaseConnection()
  .then(() => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    ✨ SERVER READY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
  })
  .catch((error) => {
    console.warn('⚠️ Supabase verification failed (server will continue):', error);
  });

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================
const shutdown = (signal: string) => {
  console.log(`\n📤 Received ${signal}, shutting down gracefully...`);
  logger.info(`Received ${signal}, shutting down...`);

  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// =============================================================================
// UNHANDLED ERRORS
// =============================================================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error({ reason }, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  logger.error({ err: error }, 'Uncaught Exception');
  process.exit(1);
});