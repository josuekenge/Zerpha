import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// =============================================================================
// 1. DETERMINE ENVIRONMENT
// =============================================================================
const isProduction = process.env.NODE_ENV === 'production';

// =============================================================================
// 2. LOAD ENV VARIABLES (dev only - Railway/production sets them directly)
// MUST happen BEFORE importing app.js because app.js imports supabase config
// which reads env vars at module load time
// =============================================================================
if (!isProduction) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to backend/.env
  const backendEnvPath = path.join(__dirname, '..', '.env');

  console.log('📁 Loading .env files...');
  console.log(`   Path: ${backendEnvPath}`);

  // Load from backend root .env
  const result = dotenv.config({ path: backendEnvPath });
  if (result.error) {
    console.log(`   ❌ Error: ${result.error.message}`);
  } else {
    console.log(`   ✅ Loaded successfully`);
  }

  // Also try loading from project root (cwd)
  dotenv.config();

  // Debug: show which env vars are loaded
  console.log('');
  console.log('📋 Env Vars After Load:');
  console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`);
  console.log(`   CLAUDE_API_KEY: ${process.env.CLAUDE_API_KEY ? '✅' : '❌'}`);
}

// =============================================================================
// 3. DETERMINE PORT
// - Development: ALWAYS use 3001 (stable for frontend connection)
// - Production: Use Railway's injected PORT (or fallback to 8080)
// =============================================================================
const PORT = isProduction
  ? parseInt(process.env.PORT || '8080', 10)
  : 3001;

// =============================================================================
// 4. STARTUP LOGGING
// =============================================================================
console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    🚀 ZERPHA BACKEND                         ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  Environment:  ${isProduction ? '🔴 PRODUCTION' : '🟢 DEVELOPMENT'}`.padEnd(66) + '║');
console.log(`║  Port:         ${PORT}`.padEnd(66) + '║');
console.log(`║  Supabase:     ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ MISSING'}`.padEnd(66) + '║');
console.log(`║  Claude API:   ${process.env.CLAUDE_API_KEY ? '✅ Loaded' : '❌ MISSING'}`.padEnd(66) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

// =============================================================================
// 5. IMPORT APP AFTER ENV LOADED (using dynamic import to ensure order)
// =============================================================================
async function startServer() {
  // Dynamic import ensures dotenv.config() runs BEFORE app.js loads
  const { app } = await import('./app.js');

  // =============================================================================
  // 6. START SERVER
  // =============================================================================
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server listening on port ${PORT}`);
    if (!isProduction) {
      console.log(`➜  Local:   http://localhost:${PORT}`);
      console.log(`➜  Health:  http://localhost:${PORT}/health`);
    }
    console.log('');
  });
}

// =============================================================================
// 7. CATCH CRASHES (for debugging)
// =============================================================================
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});

// Start the server
startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});