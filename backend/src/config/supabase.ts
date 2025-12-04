import { createClient } from '@supabase/supabase-js';
import { logger } from '../logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function verifySupabaseConnection(): Promise<void> {
  try {
    const { error } = await supabase.from('searches').select('id').limit(1);
    if (error) {
      logger.warn({ err: error }, '[supabase] Verification query failed');
    } else {
      console.info('[supabase] Connection verified');
    }
  } catch (err) {
    logger.warn({ err }, '[supabase] Unable to verify connection');
  }
}

export { supabase };

