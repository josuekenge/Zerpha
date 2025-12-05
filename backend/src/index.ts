import { app } from './app.js';

// =============================================================================
// PORT CONFIGURATION - Uses Railway's PORT or fallback to 3001
// =============================================================================
const PORT = process.env.PORT || 3001;

console.log('');
console.log('═══════════════════════════════════════');
console.log('       🚀 ZERPHA BACKEND SERVER');
console.log('═══════════════════════════════════════');
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Port: ${PORT}`);
console.log('═══════════════════════════════════════');
console.log('');

// =============================================================================
// START SERVER
// =============================================================================
const server = app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

// Handle errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM received, shutting down...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT received, shutting down...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

// Handle unhandled errors
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});