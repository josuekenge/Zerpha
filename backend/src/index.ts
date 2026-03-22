import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. LOAD ENV VARIABLES (dev only - Railway sets them directly)
if (process.env.NODE_ENV !== 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config();
  dotenv.config({ path: path.join(__dirname, '.env') });
}

// 2. ENV DEBUG
console.log('========================================');
console.log('🔧 STARTUP - ENV CHECK');
console.log('========================================');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || '3001');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌ MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌ MISSING');
console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✅' : '❌ MISSING');
console.log('========================================');

// 3. IMPORT APP AFTER ENV LOADED (dynamic import so dotenv runs first)
const { app } = await import('./app.js');

// 4. START SERVER
const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  console.log(`➜  Health: http://0.0.0.0:${PORT}/health`);
});

// 5. CATCH CRASHES (for debugging)
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});
