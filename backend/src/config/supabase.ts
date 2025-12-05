import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../logger.js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is not set');
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Log configuration (without exposing secrets)
console.log('🔧 Supabase Configuration:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Role Key: ${supabaseServiceRoleKey.substring(0, 20)}...`);

/**
 * Admin client with service role key - use for:
 * - Inserts
 * - Updates
 * - Deletes
 * - Any operation that requires elevated privileges
 */
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Standard client - same as admin in backend context since we use service role key
 * In a full setup, this could use the anon key for reads
 * For now, we use the same client for simplicity
 */
export const supabase: SupabaseClient = supabaseAdmin;

/**
 * Verify Supabase connection on startup
 */
export async function verifySupabaseConnection(): Promise<void> {
  try {
    const { data, error } = await supabase.from('searches').select('id').limit(1);
    if (error) {
      logger.warn({ err: error }, '[supabase] Verification query failed - table may not exist yet');
      console.warn('⚠️ Supabase verification query failed:', error.message);
    } else {
      console.info('✅ Supabase connection verified');
      logger.info('[supabase] Connection verified successfully');
    }
  } catch (err) {
    logger.warn({ err }, '[supabase] Unable to verify connection');
    console.warn('⚠️ Supabase connection check failed:', (err as Error).message);
  }
}
