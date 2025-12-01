import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const supabase: SupabaseClient<any> = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseOptions,
);

export async function verifySupabaseConnection(): Promise<void> {
  try {
    const { error } = await supabase.from('searches').select('id').limit(1);
    if (error) {
      console.warn('[supabase] Verification query failed:', error.message);
    } else {
      console.info('[supabase] Connection verified');
    }
  } catch (err) {
    console.warn('[supabase] Unable to verify connection:', err);
  }
}

