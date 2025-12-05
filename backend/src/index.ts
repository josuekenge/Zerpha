import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. LOAD ENV VARIABLES
// In production (Railway), env vars are set directly by the platform
// In development, load from .env file
if (process.env.NODE_ENV !== 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Try loading from standard root
  dotenv.config();
  // Try loading explicitly from src (for local dev)
  dotenv.config({ path: path.join(__dirname, '.env') });

  console.log('------------------------------------------------');
  console.log('🔧 DEV MODE - Loading .env file');
  console.log('Looking for .env in:', path.join(__dirname, '.env'));
}

// Debug: Print env check (works in both dev and production)
console.log('------------------------------------------------');
console.log('🔧 ENVIRONMENT CHECK');
console.log('------------------------------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('Current Directory:', process.cwd());
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ FOUND' : '❌ MISSING');
console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✅ FOUND' : '❌ MISSING');
console.log('PORT:', process.env.PORT || '3001');
console.log('------------------------------------------------');

// Import app AFTER env vars are loaded
import { app } from './app.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`➜  Health Check: http://localhost:${PORT}/health`);
  console.log(`➜  Debug Info:   http://localhost:${PORT}/debug-health\n`);
});

// 2. PREVENT CRASHES FROM KILLING THE SERVER
// If Supabase fails to connect, this keeps the server alive so you see the error instead of a 502
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION (Server would have crashed):');
  console.error(err);
  // Keep process alive for investigation (bad for production long term, good for debugging)
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});