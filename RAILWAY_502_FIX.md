# Railway 502 Error & CORS Fix - December 5, 2025

## Summary
The Zerpha backend was returning 502 errors on Railway, causing the frontend to show CORS errors. After extensive debugging, we identified **two root causes** and fixed them.

---

## Problem 1: Port Mismatch (Caused 502)

### Symptom
- Railway deploy logs showed: `Server listening on http://0.0.0.0:8080`
- Railway networking was configured to route to port `3001`
- **Result: 502 Bad Gateway** (proxy couldn't reach the app)

### Root Cause
Railway injects `PORT` environment variable (e.g., 8080), but the networking settings were pointing to a different port (3001).

### Fix
In Railway Dashboard → **Settings** → **Networking**:
- Changed the port to match what the app was listening on (8080)

**OR** set `PORT=3001` in Railway Variables to force the app to use 3001.

---

## Problem 2: CORS Wildcard with Credentials (Caused CORS Error)

### Symptom
```
Access to fetch has been blocked by CORS policy: 
The value of 'Access-Control-Allow-Origin' must not be the wildcard '*' 
when the request's credentials mode is 'include'
```

### Root Cause
- Backend used `app.use(cors())` which returns `Access-Control-Allow-Origin: *`
- Frontend used `credentials: 'include'` in fetch requests
- These two are **incompatible** per CORS spec

### Fix
Changed `backend/src/app.ts`:

**Before:**
```typescript
app.use(cors());
```

**After:**
```typescript
app.use(cors({
  origin: true,       // Reflects request origin (not wildcard)
  credentials: true   // Allow cookies/auth headers
}));
```

`origin: true` makes the server respond with the actual request origin (e.g., `https://www.zerpha.ca`) instead of `*`, which is required when `credentials: 'include'` is used.

---

## Problem 3: Server Binding (Preventative Fix)

### Fix
In `backend/src/index.ts`, ensured the server binds to `0.0.0.0`:

```typescript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
});
```

This ensures the server is accessible from outside the container (Railway's proxy can reach it).

---

## Files Changed

### `backend/src/index.ts`
```typescript
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
console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✅' : '❌ MISSING');
console.log('========================================');

// 3. IMPORT APP AFTER ENV LOADED
import { app } from './app.js';

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
```

### `backend/src/app.ts`
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { apiRouter } from './routes/index.js';

const app = express();

// Trust proxy (Railway, Heroku, etc.)
app.set('trust proxy', 1);

// ============ CORS ============
app.use(cors({
  origin: true,       // Reflects request origin (works with credentials)
  credentials: true   // Allow cookies/auth headers
}));

// ============ MIDDLEWARE ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// ============ HEALTH CHECK ============
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3001,
  });
});

// ============ API ROUTES ============
app.use('/api', apiRouter);

// ============ 404 ============
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============ ERROR HANDLER ============
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export { app };
```

---

## Railway Environment Variables Required

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `CLAUDE_API_KEY` | Anthropic Claude API key |
| `NODE_ENV` | Set to `production` |
| `CORS_ORIGIN` | (Optional) Comma-separated allowed origins |

---

## Verification Checklist

1. ✅ Health endpoint works: `https://zerpha-production.up.railway.app/health`
2. ✅ Returns JSON: `{"status":"ok",...}`
3. ✅ Frontend loads without CORS errors
4. ✅ API requests succeed (login, search, etc.)

---

## Key Lessons

1. **502 ≠ CORS error** - Browser shows CORS error when server doesn't respond at all
2. **Port mismatch kills Railway** - Always verify Railway networking port matches app listening port
3. **`cors()` with `credentials: 'include'` requires `origin: true`** - Cannot use wildcard `*`
4. **Bind to `0.0.0.0`** - Required for containerized deployments
