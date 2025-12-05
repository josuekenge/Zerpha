# 🚨 IMMEDIATE ACTION REQUIRED - Railway 502 Fix

## THE PROBLEM
Your Railway backend is returning **502 Bad Gateway** because it's **crashing on startup**.

Looking at your Railway logs screenshot, I see all requests returning `502` status. This means:
- ❌ Backend is NOT running
- ❌ The 502 is coming from Railway's proxy (not your app)
- ❌ CORS errors are a **symptom**, not the cause

## THE ROOT CAUSE
Railway backend is missing critical environment variables, specifically:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Without these, your backend crashes immediately on startup when it tries to connect to Supabase.

---

## ✅ FIXES I JUST APPLIED TO YOUR CODE

### 1. Fixed `backend/Dockerfile`
- Removed incorrect nested `backend/` paths
- Now works correctly when Railway runs from backend directory

### 2. Fixed `backend/src/app.ts`
- CORS now reads from `CORS_ORIGIN` environment variable
- Has safe defaults (localhost + your production domains)
- Better error logging

### 3. Fixed `frontend/src/api/config.ts`
- Requires `VITE_API_BASE_URL` to be set (no more localhost fallback in production)
- Clear error messages when misconfigured
- Logs connection URL for debugging

### 4. Fixed `frontend/src/api/client.ts` and `people.ts`
- Added `credentials: 'include'` for cross-origin cookie support

### 5. Created `frontend/.env.local`
- Set `VITE_API_BASE_URL=http://localhost:3001` for local development

---

## 🎯 WHAT YOU NEED TO DO NOW

### STEP 1: Fix Railway Backend (CRITICAL)

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your backend service** (zerpha-production)
3. **Click "Variables" tab**
4. **Add these REQUIRED variables**:

```
SUPABASE_URL=https://ynemavjerajwoungom1.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-supabase>
CLAUDE_API_KEY=<your-claude-api-key>
CORS_ORIGIN=https://www.zerpha.ca,https://zerpha.ca,https://zerpha.netlify.app
```

5. **Click "Redeploy"** button
6. **Watch the deployment logs** - look for:
   ```
   ✅ Build completed
   🔒 CORS Configured for: [...]
   🚀 Server running on port 3001
   ```

### STEP 2: Verify Railway Backend Works

Test the health endpoint:
```bash
curl https://zerpha-production.up.railway.app/health
```

**Expected**: `{"status":"ok","timestamp":"...","port":"3001"}`
**If 502**: Check Railway logs for error message, likely missing env var

### STEP 3: Fix Netlify Frontend

1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Select your site** (www.zerpha.ca)
3. **Go to Site Settings → Environment Variables**
4. **Add/Update**:

```
VITE_API_BASE_URL=https://zerpha-production.up.railway.app
VITE_SUPABASE_URL=https://ynemavjerajwoungom1.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key-from-supabase>
```

5. **Go to Deploys tab**
6. **Click "Trigger deploy" → "Clear cache and deploy site"**

### STEP 4: Verify Everything Works

1. Open https://www.zerpha.ca
2. Open browser DevTools (F12) → Console tab
3. **Look for**: `🔌 API Client connecting to: https://zerpha-production.up.railway.app`
4. Try to use the app (search, login, etc.)
5. Check Network tab - requests should go to Railway, not get 502

---

## 📋 ENVIRONMENT VARIABLES REFERENCE

### Railway Backend (REQUIRED)

| Variable | Where to Get It |
|----------|-----------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role (secret key) |
| `CLAUDE_API_KEY` | Anthropic Console → API Keys |
| `CORS_ORIGIN` | `https://www.zerpha.ca,https://zerpha.ca,https://zerpha.netlify.app` |

### Netlify Frontend (REQUIRED)

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://zerpha-production.up.railway.app` |
| `VITE_SUPABASE_URL` | Same as backend `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon (public key) |

---

## 🔍 HOW TO DEBUG

### If Railway still returns 502:

1. **Check Railway Logs**:
   - Railway Dashboard → Your Service → Deployments → Click latest → View Logs
   - Look for error messages like:
     - `❌ Invalid or missing environment variables`
     - `Error: SUPABASE_URL is not defined`
     - `Cannot find module`

2. **Common Errors**:
   - **Missing SUPABASE_URL**: Add to Railway Variables
   - **Build failed**: Check build logs, verify `npm run build` works locally
   - **Module not found**: Dependencies missing, check package.json

### If Frontend still calls wrong URL:

1. **Check browser console** for `🔌 API Client connecting to:`
2. **If shows localhost**: Netlify didn't rebuild with new env vars
3. **If shows zerpha.ca**: `VITE_API_BASE_URL` not set in Netlify
4. **Solution**: Set env var in Netlify, then "Clear cache and deploy site"

### If CORS errors persist:

1. **First verify backend is UP** (health check returns 200, not 502)
2. **Check Railway logs** for `🚫 CORS blocked request from:`
3. **If blocked**: Add that origin to `CORS_ORIGIN` in Railway
4. **Restart Railway** service after changing env vars

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:

1. ✅ `curl https://zerpha-production.up.railway.app/health` returns `{"status":"ok"}`
2. ✅ Browser console shows `🔌 API Client connecting to: https://zerpha-production.up.railway.app`
3. ✅ Network tab shows requests to Railway (not 502 errors)
4. ✅ No CORS errors in console
5. ✅ App features work (search, login, etc.)

---

## 📞 IF YOU'RE STILL STUCK

Send me:
1. Screenshot of Railway deployment logs
2. Screenshot of Railway environment variables (hide sensitive values)
3. Screenshot of browser console + network tab
4. Error message from Railway logs

---

## 🎯 TL;DR - DO THIS NOW

1. **Railway**: Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLAUDE_API_KEY`, `CORS_ORIGIN`
2. **Railway**: Click "Redeploy"
3. **Test**: `curl https://zerpha-production.up.railway.app/health`
4. **Netlify**: Set `VITE_API_BASE_URL=https://zerpha-production.up.railway.app`
5. **Netlify**: "Clear cache and deploy site"
6. **Test**: Open www.zerpha.ca, check console log

**The 502 errors will disappear once Railway has the required environment variables!**
