## Zerpha Backend Setup

The backend is a Node.js/Express API written in TypeScript. It talks directly to Supabase using `@supabase/supabase-js` and relies on SQL migrations stored in `supabase/migrations`. Prisma is **not** used anywhere in this project.

### ⚠️ Security: Environment Variables & Secrets

**IMPORTANT:** All secrets (API keys, service account credentials, database URLs) must ONLY exist in:
- Local `.env` files (ignored by Git)
- Your deployment environment (Vercel, Railway, etc.)

**NEVER commit `.env` files or credential JSON files to Git.**

The repository `.gitignore` is configured to block:
- `.env`, `.env.local`, `.env.*`
- `*.service-account.json`, `*credentials*.json`, `*-key.json`

If you accidentally commit a secret:
1. Immediately rotate/delete the key in the provider (GCP, Supabase, etc.)
2. Remove the file from Git tracking (see below)
3. Consider using `git filter-repo` or BFG to scrub history if already pushed

### Migrations Setup

All schema changes live in `supabase/migrations/0001_initial_schema.sql`. This file already defines the required tables:

- `searches`
- `companies`
- `reports`

To apply them to your Supabase project:

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```
2. Log in to Supabase (one-time):
   ```bash
   supabase login
   ```
3. From the repo root, push migrations:
   ```bash
   supabase db push
   ```

### Editing Migrations

- For new tables or columns, edit `supabase/migrations/0001_initial_schema.sql` (or add a new SQL file) and re-run `supabase db push`.
- Keep the SQL compatible with Supabase/Postgres (no Prisma or ORMs required).

### Resetting the Database (local dev only)

If you are using the Supabase local stack:

```bash
supabase db reset
```

For production/hosted Supabase, use the dashboard to reset data (be careful—this wipes everything).

### Verifying Backend Starts

1. Copy `backend/.env.example` to `backend/.env` and fill in all required keys (Supabase URL + service role, Claude/Gemini keys, Google credentials, etc.).
2. Install dependencies and start the server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. You should see logs confirming Supabase connection and Express listening on the configured port.

