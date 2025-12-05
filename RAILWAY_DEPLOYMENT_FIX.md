# 🚀 Railway Deployment Fix Guide

## Current Issue
Your Railway backend is returning **502 errors** because it's crashing on startup. This is likely due to:
1. Missing environment variables (especially `SUPABASE_URL`)
2. Incorrect Dockerfile paths
3. Build failures

## ✅ Fixes Applied

### 1. Fixed Dockerfile
- Removed nested `backend/` paths (Railway already runs from backend directory)
- Uses multi-stage build for smaller image
- Properly separates build and production dependencies

### 2. Updated CORS Configuration
- Now reads `CORS_ORIGIN` from environment
- Has safe defaults for local development
- Logs blocked requests for debugging

### 3. Updated Frontend API Client
- Requires `VITE_API_BASE_URL` to be set
- Includes credentials for cross-origin requests
- Clear error messages when misconfigured

---

## 🔧 Railway Deployment Steps

### Step 1: Set Environment Variables in Railway

Go to Railway Dashboard → Your Backend Service → Variables and add:

```env
# Required - Database
SUPABASE_URL=https://ynemavjerajwoungom1.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required - AI APIs
CLAUDE_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIzaSy...

# Required - CORS (your frontend URLs)
CORS_ORIGIN=https://www.zerpha.ca,https://zerpha.ca,https://zerpha.netlify.app

# Optional - Google Cloud (for Slides export)
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SLIDES_TEMPLATE_ID=1abc123...

# Optional - Contact scraping
APIFY_TOKEN=apify_api_xxxxxxxxxxxxx

# Railway sets these automatically
NODE_ENV=production
PORT=(set by Railway)
```

### Step 2: Verify Railway Settings

In Railway Dashboard → Service Settings:

- **Root Directory**: `backend` (if deploying from monorepo) or `/` (if backend is root)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`
- **Health Check Timeout**: 30 seconds

### Step 3: Trigger Redeploy

1. Go to Railway Dashboard → Deployments
2. Click "Redeploy" on the latest deployment
3. Watch the build logs for errors

### Step 4: Check Deployment Logs

Look for these success messages:
```
✅ Build completed
🔒 CORS Configured for: [your origins]
🚀 Server running on port 3001
```

If you see errors, check:
- ❌ `SUPABASE_URL is not defined` → Add to Railway Variables
- ❌ `Cannot find module` → Build failed, check build logs
- ❌ `EADDRINUSE` → Port conflict (shouldn't happen on Railway)

---

## 🌐 Netlify Deployment Steps

### Step 1: Set Environment Variables

Netlify Dashboard → Site Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://zerpha-production.up.railway.app
VITE_SUPABASE_URL=https://ynemavjerajwoungom1.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Verify Build Settings

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

### Step 3: Redeploy

1. Netlify Dashboard → Deploys
2. Click "Trigger deploy" → "Clear cache and deploy site"

---

## ✅ Verification Checklist

### Backend (Railway)

Test the health endpoint:
```bash
curl https://zerpha-production.up.railway.app/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-12-05T...","port":"3001"}
```

If you get **502**:
1. Check Railway logs for crash errors
2. Verify `SUPABASE_URL` is set in Railway Variables
3. Check build logs for TypeScript errors

### Frontend (Netlify)

1. Open https://www.zerpha.ca
2. Open browser DevTools → Console
3. Look for: `🔌 API Client connecting to: https://zerpha-production.up.railway.app`
4. Open Network tab
5. Trigger an API call (search, login, etc.)
6. Verify requests go to `zerpha-production.up.railway.app`, not `www.zerpha.ca`

### CORS Verification

If you see CORS errors:
1. Check Railway logs for: `🚫 CORS blocked request from: https://www.zerpha.ca`
2. If blocked, verify `CORS_ORIGIN` includes your frontend URL
3. Restart Railway service after changing env vars

---

## 🐛 Common Issues & Fixes

### Issue: Railway returns 502

**Cause**: Backend crashed on startup

**Fix**:
1. Check Railway logs for error message
2. Most common: Missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`
3. Add missing variables and redeploy

### Issue: Frontend shows "CORS error"

**Cause**: Either backend is down (502) OR CORS not configured

**Fix**:
1. First, verify backend health endpoint works
2. If backend is up, check `CORS_ORIGIN` in Railway
3. Verify frontend is calling correct URL (check console log)

### Issue: Frontend calls wrong URL

**Cause**: `VITE_API_BASE_URL` not set or Netlify didn't rebuild

**Fix**:
1. Set `VITE_API_BASE_URL` in Netlify env vars
2. Trigger "Clear cache and deploy site"
3. Check console log shows Railway URL

### Issue: "Cannot find module" in Railway logs

**Cause**: Build failed or dependencies missing

**Fix**:
1. Check `package.json` has all dependencies
2. Verify `npm run build` works locally
3. Check Railway build logs for TypeScript errors

---

## 📝 Quick Reference

### Railway Backend URL
```
https://zerpha-production.up.railway.app
```

### Netlify Frontend URLs
```
https://www.zerpha.ca
https://zerpha.ca
https://zerpha.netlify.app
```

### Critical Environment Variables

**Railway (Backend)**:
- `SUPABASE_URL` ← Most common missing variable
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `CLAUDE_API_KEY`

**Netlify (Frontend)**:
- `VITE_API_BASE_URL` ← Must point to Railway
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🎯 Next Steps

1. ✅ Fixed Dockerfile (already done)
2. ✅ Fixed CORS configuration (already done)
3. ✅ Fixed frontend API client (already done)
4. ⏳ **YOU NEED TO DO**: Set environment variables in Railway
5. ⏳ **YOU NEED TO DO**: Redeploy Railway backend
6. ⏳ **YOU NEED TO DO**: Set `VITE_API_BASE_URL` in Netlify
7. ⏳ **YOU NEED TO DO**: Redeploy Netlify frontend

After completing steps 4-7, your production deployment should work!
