# Zerpha - AI-Powered Company Discovery Platform

Zerpha is a full-stack application for discovering and analyzing companies using AI. It features Google authentication, multi-tenant data isolation, and automated contact scraping.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Production Deployment](#production-deployment)
- [Environment Variables Reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18+ (recommended: v20+)
- **npm** v9+
- **Supabase CLI** (for database migrations)
- **Git**

Required accounts/API keys:

- [Supabase](https://supabase.com) - Database and Authentication
- [Anthropic Claude](https://anthropic.com) - AI company analysis
- [Google Cloud](https://console.cloud.google.com) - Slides/Docs integration
- [Apify](https://apify.com) - Contact scraping (optional but recommended)

---

## Project Structure

```
Zerpha/
├── backend/                 # Node.js/Express API (TypeScript)
│   ├── src/
│   │   ├── config/          # Environment & Supabase config
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (AI, scraping, etc.)
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── .env                 # Backend environment variables
│
├── frontend/                # React + Vite (TypeScript)
│   ├── src/
│   │   ├── api/             # API client helpers
│   │   ├── components/      # React components
│   │   ├── lib/             # Supabase client, auth, utils
│   │   └── types/           # TypeScript types
│   ├── package.json
│   ├── .env                 # Frontend environment variables (production)
│   └── .env.local           # Local development overrides (gitignored)
│
├── supabase/
│   └── migrations/          # SQL migration files
│
└── README.md
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create Environment File

Create `backend/.env` with the following variables:

```env
# Server
NODE_ENV=development
PORT=3001

# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI APIs (Required)
CLAUDE_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIzaSy...

# Google Cloud (Required for Slides/Docs export)
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SLIDES_TEMPLATE_ID=1abc123...

# Apify (Optional - for contact scraping)
APIFY_TOKEN=apify_api_xxxxxxxxxxxxx

# CORS (Optional - defaults to zerpha.ca, zerpha.netlify.app, localhost)
# CORS_ORIGIN=https://www.zerpha.ca,https://zerpha.ca,https://zerpha.netlify.app
```

### 3. Start the Backend

```bash
cd backend
npm run dev
```

You should see:

```
[supabase] Connection verified
🚀 Server running on port 3001
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create Environment Files

**For Local Development:** Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**For Production:** Create `frontend/.env` (or set in Netlify Dashboard):

```env
VITE_API_BASE_URL=https://zerpha-production.up.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Important:** 
> - `.env.local` takes precedence over `.env` for local development
> - Variables must start with `VITE_` prefix (Vite requirement)
> - Use the **anon/public** key, NOT the service role key

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

You should see:

```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
🔌 API Client connecting to: http://localhost:3001
```

---

## Production Deployment

### Frontend (Netlify)

**Environment Variables (Netlify Dashboard → Site Settings → Environment):**

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://zerpha-production.up.railway.app` |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (your anon key) |

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Base directory: `frontend`

### Backend (Railway)

**Environment Variables (Railway Dashboard → Service → Variables):**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | (set automatically by Railway) |
| `CORS_ORIGIN` | `https://www.zerpha.ca,https://zerpha.ca,https://zerpha.netlify.app` |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `CLAUDE_API_KEY` | Your Claude API key |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GOOGLE_PROJECT_ID` | Your Google project ID |
| `GOOGLE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key |
| `APIFY_TOKEN` | (optional) Apify token |

**Health Check:** Railway should check `/health` endpoint.

### Supabase Auth Settings

Add your production URLs to Supabase:

1. Go to **Authentication → URL Configuration**
2. Add to **Site URL**: `https://www.zerpha.ca`
3. Add to **Redirect URLs**:
   - `https://www.zerpha.ca`
   - `https://zerpha.ca`
   - `https://zerpha.netlify.app`

---

## Database Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### 4. Apply Migrations

```bash
supabase db push
```

This creates: `searches`, `companies`, `people`, `reports` tables.

### 5. Enable Google Auth

1. Supabase Dashboard → Authentication → Providers
2. Enable **Google** provider
3. Add OAuth credentials from Google Cloud Console

---

## Running the Application

### Development Mode

Open **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Server port (default: `3001`) |
| `CORS_ORIGIN` | No | Comma-separated allowed origins |
| `SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Service role key (secret) |
| `CLAUDE_API_KEY` | ✅ Yes | Anthropic Claude API key |
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `GOOGLE_*` | ✅ Yes | Google Cloud credentials |
| `APIFY_TOKEN` | No | Apify API token |

### Frontend (`frontend/.env` or `.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ Yes | Backend API URL |
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon/public key |

---

## Troubleshooting

### CORS Errors

**Symptom:** Browser shows "CORS policy" errors.

**Solutions:**
1. Check `CORS_ORIGIN` is set correctly in Railway
2. Verify frontend is using `VITE_API_BASE_URL` (check console for `🔌 API Client connecting to:`)
3. If backend returns 502, check Railway logs for the real error

### Frontend Calling Wrong URL

**Symptom:** Network tab shows requests to `www.zerpha.ca/api/...` instead of Railway.

**Solutions:**
1. Set `VITE_API_BASE_URL=https://zerpha-production.up.railway.app` in Netlify
2. Redeploy the site (Netlify → Deploys → Trigger Deploy)

### Railway 502 Bad Gateway

**Common Causes:**
1. Missing environment variables (especially `SUPABASE_URL`)
2. Build failed - check Railway build logs
3. Health check failing

### Local Backend Works But Production Doesn't

**Checklist:**
- [ ] `VITE_API_BASE_URL` set in Netlify to Railway URL
- [ ] `CORS_ORIGIN` set in Railway to include Netlify URLs
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in Railway
- [ ] Site redeployed after changing env vars

---

## Verification Checklist

After deployment, verify:

1. ✅ **Netlify Console:** No errors, `🔌 API Client connecting to: https://zerpha-production.up.railway.app`
2. ✅ **Network Tab:** API requests go to `https://zerpha-production.up.railway.app/api/...`
3. ✅ **Railway Health:** `https://zerpha-production.up.railway.app/health` returns `{"status":"ok"}`
4. ✅ **Railway Logs:** Shows `🔒 CORS Configured for: [your origins]`

---

## ⚠️ Security Notes

**NEVER commit `.env` files or credentials to Git.**

The `.gitignore` blocks:
- `.env`, `.env.local`, `.env.*`
- `*.service-account.json`
- `*credentials*.json`
- `*-key.json`

---

## License

MIT
