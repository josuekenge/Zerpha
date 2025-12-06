import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  const message =
    'VITE_SUPABASE_URL is missing. Create a .env file in the frontend project root (next to vite.config.ts) and define VITE_SUPABASE_URL.';
  console.error(message);
  throw new Error('supabaseUrl is required');
}

if (!supabaseAnonKey) {
  const message =
    'VITE_SUPABASE_ANON_KEY is missing. Create a .env file in the frontend project root (next to vite.config.ts) and define VITE_SUPABASE_ANON_KEY.';
  console.error(message);
  throw new Error('supabaseAnonKey is required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

