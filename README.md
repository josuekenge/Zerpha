# Zerpha - AI-Powered Company Discovery Platform

Zerpha is a full-stack application for discovering and analyzing companies using AI. It features Google authentication, multi-tenant data isolation, and automated contact scraping.

---

## 🚀 Quick Start

Get up and running in minutes.

### 1. Backend
```bash
cd backend
npm install
# Create .env file (see below)
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
# Create .env file (see below)
npm run dev
```

### 3. Access
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 🛠️ Prerequisites

- **Node.js** v18+ (recommended: v20+)
- **npm** v9+
- **Supabase Account** (for database & auth)
- **Google Cloud Console** (for OAuth & Slides API)

---

## ⚙️ Backend Setup

The backend handles API requests, AI processing (Claude/Gemini), and database interactions.

1.  **Navigate to backend:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the `backend/` directory with the following:

    ```env
    # Server
    NODE_ENV=development
    PORT=3001

    # Supabase (Required)
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

    # AI APIs (Required)
    CLAUDE_API_KEY=sk-ant-api03-...
    GEMINI_API_KEY=AIzaSy...

    # Google Cloud (Required for Slides/Docs export)
    GOOGLE_PROJECT_ID=your-project-id
    GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json
    GOOGLE_CLIENT_EMAIL=your-service-account@email.com
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    GOOGLE_SLIDES_TEMPLATE_ID=your_slides_template_id

    # Apify (Optional - for contact scraping)
    APIFY_TOKEN=your_apify_token
    ```

4.  **Start the Server:**
    ```bash
    npm run dev
    ```

---

## 🎨 Frontend Setup

The frontend is a React + Vite application using Tailwind CSS.

1.  **Navigate to frontend:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the `frontend/` directory (see `.env.example` for reference):

    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
    VITE_API_BASE_URL=http://localhost:3001
    ```

    > **Note:** Variables must start with `VITE_` to be exposed to the frontend. The backend should be running separately on port `3001` during local development.

4.  **Start the Dev Server:**
    ```bash
    npm run dev
    ```

---

## 🗄️ Database Setup (Supabase)

1.  **Create a Project:** Go to [Supabase](https://supabase.com) and create a new project.
2.  **Run Migrations:** Use the Supabase CLI to push the schema.
    ```bash
    npm install -g supabase
    supabase login
    supabase link --project-ref your-project-ref
    supabase db push
    ```
3.  **Enable Google Auth:**
    - Go to **Authentication > Providers** in Supabase.
    - Enable **Google**.
    - Add your Client ID and Secret from Google Cloud Console.
    - Set the Redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

---

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

---

## 📄 License

MIT
