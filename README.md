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
    Create a `.env` file in the `frontend/` directory:

    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
    ```

    > **Note:** Variables must start with `VITE_` to be exposed to the frontend.

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

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Check if `.env` exists in `backend/` and has all keys. |
| **Frontend "Supabase env missing"** | Ensure `.env` is in `frontend/` and keys start with `VITE_`. Restart server. |
| **Port 3001 in use** | Kill the process: `npx kill-port 3001` or change `PORT` in `.env`. |
| **Google Login fails** | Check Redirect URL in Google Cloud Console matches Supabase config. |

---

## 📄 License

MIT
