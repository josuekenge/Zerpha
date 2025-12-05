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
│   └── .env                 # Frontend environment variables
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

<<<<<<< HEAD
3.  **Configure Environment:**
    Create a `.env` file in the `frontend/` directory (see `.env.example` for reference):

    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
    VITE_API_BASE_URL=http://localhost:3001
    ```

    > **Note:** Variables must start with `VITE_` to be exposed to the frontend. The backend should be running separately on port `3001` during local development.
=======
Create `backend/.env` with the following variables:

```env
# Server
NODE_ENV=development
PORT=3001

# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
>>>>>>> parent of e7a4b16f (Update README.md)

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
```

### 3. Get Your API Keys

| Variable | Where to get it |
|----------|-----------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role (secret) |
| `CLAUDE_API_KEY` | [Anthropic Console](https://console.anthropic.com/) |
| `GEMINI_API_KEY` | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `GOOGLE_*` | [Google Cloud Console](https://console.cloud.google.com/) → Service Accounts |
| `APIFY_TOKEN` | [Apify Console](https://console.apify.com/) → Settings → Integrations |

### 4. Start the Backend

```bash
cd backend
npm run dev
```

You should see:

```
[supabase] Connection verified
[12:00:00.000] INFO: 🚀 Backend ready on http://localhost:3001
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create Environment File

Create `frontend/.env` in the frontend root directory (next to `package.json`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Important:** 
> - Frontend uses `VITE_` prefix (Vite requirement)
> - Use the **anon/public** key, NOT the service role key
> - The `.env` file must be in `frontend/` directory, not `frontend/src/`

### 3. Get Your Frontend Keys

| Variable | Where to get it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon (public) |

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

<<<<<<< HEAD
## 🚂 Railway Deployment

Deploy Zerpha to Railway as two separate services (backend + frontend).

### Backend Service

1. **Create a new service** in Railway and connect your GitHub repo
2. **Set the root directory** to `backend`
3. **Add environment variables:**
   ```
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   CLAUDE_API_KEY=your-claude-api-key
   FRONTEND_URL=https://your-frontend.railway.app
   APIFY_TOKEN=your-apify-token (optional)
   ```
4. Railway will auto-detect and deploy using the `railway.json` config

### Frontend Service

1. **Create another service** in Railway and connect the same repo
2. **Set the root directory** to `frontend`
3. **Add environment variables:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-backend.railway.app
   ```
4. Railway will auto-detect and deploy using the `railway.json` config

### Important Notes

- **CORS:** Make sure `FRONTEND_URL` in the backend matches your deployed frontend URL
- **Supabase Auth:** Add your Railway frontend URL to Supabase's allowed redirect URLs:
  - Go to **Authentication > URL Configuration**
  - Add `https://your-frontend.railway.app` to Site URL and Redirect URLs
- **Health Check:** Backend has a `/health` endpoint for Railway health checks

---

## 🌐 Netlify Deployment

You can also deploy the frontend independently on Netlify while the backend lives on Railway.

1. **Site configuration**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory / repository root: `frontend`
2. **Environment variables (Netlify → Site Configuration → Environment):**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-backend.onrailway.app
   ```
3. The `frontend/netlify.toml` file already configures the build/publish settings and includes an SPA redirect so client-side routing works.
4. For local development, run the backend separately on port `3001` and set `VITE_API_BASE_URL=http://localhost:3001`.

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Check if `.env` exists in `backend/` and has all keys. |
| **Frontend "Supabase env missing"** | Ensure `.env` is in `frontend/` and keys start with `VITE_`. Restart server. |
| **Port 3001 in use** | Kill the process: `npx kill-port 3001` or change `PORT` in `.env`. |
| **Google Login fails** | Check Redirect URL in Google Cloud Console matches Supabase config. |
| **Railway build fails** | Make sure root directory is set correctly (`backend` or `frontend`). |
| **CORS errors on Railway** | Set `FRONTEND_URL` env var in backend to your frontend Railway URL. |
=======
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

> Find your project ref in Supabase Dashboard URL: `https://supabase.com/dashboard/project/[PROJECT_REF]`

### 4. Apply Migrations

```bash
supabase db push
```

This will create the following tables:

- `searches` - Search history
- `companies` - Discovered companies
- `people` - Contact information
- `reports` - Generated reports

### 5. Enable Google Auth in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Google** provider
3. Add your Google OAuth credentials
4. Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`
>>>>>>> parent of e7a4b16f (Update README.md)

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

### Authentication Flow

1. Visit http://localhost:5173
2. Click any CTA button on the landing page
3. Login with Google or email
4. You'll be redirected to the workspace at `/workspace`

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development`, `test`, or `production` (default: `development`) |
| `PORT` | No | Server port (default: `3001`) |
| `SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service role key (secret) |
| `CLAUDE_API_KEY` | ✅ Yes | Anthropic Claude API key |
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `GOOGLE_PROJECT_ID` | ✅ Yes | Google Cloud project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ Yes | Path to service account JSON |
| `GOOGLE_CLIENT_EMAIL` | ✅ Yes | Service account email |
| `GOOGLE_PRIVATE_KEY` | ✅ Yes | Service account private key |
| `GOOGLE_SLIDES_TEMPLATE_ID` | ✅ Yes | Google Slides template ID |
| `APIFY_TOKEN` | No | Apify API token (for contact scraping) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon/public key |

---

## Troubleshooting

### Backend won't start

**Error:** `❌ Invalid or missing environment variables`

**Solution:** Check that all required variables are set in `backend/.env`. See the table above.

---

**Error:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:** Another process is using port 3001. Either:
- Kill the existing process: `npx kill-port 3001`
- Or change `PORT` in your `.env`

---

### Frontend shows "Supabase environment variables are not set"

**Solution:**
1. Ensure `frontend/.env` exists (not `frontend/src/.env`)
2. Variables must start with `VITE_`
3. Restart the Vite dev server after changing `.env`

---

### Google Auth not working

**Solution:**
1. Ensure Google provider is enabled in Supabase Dashboard
2. Check redirect URL is correct in Google Cloud Console
3. Verify OAuth consent screen is configured

---

### People section is empty

**Solution:**
1. Add `APIFY_TOKEN` to `backend/.env`
2. Run a new search
3. Check backend logs for `[people] scraped people from Apify`

---

### Database errors

**Solution:**
1. Run migrations: `supabase db push`
2. Check RLS policies are applied (migration `0005_add_user_id_rls.sql`)
3. Verify `user_id` column exists in `companies` and `people` tables

---

## ⚠️ Security Notes

**NEVER commit `.env` files or credentials to Git.**

The `.gitignore` is configured to block:
- `.env`, `.env.local`, `.env.*`
- `*.service-account.json`
- `*credentials*.json`
- `*-key.json`

If you accidentally commit a secret:
1. Immediately rotate/delete the key
2. Remove from Git: `git rm --cached filename`
3. Consider using `git filter-repo` to scrub history

---

## License

MIT
