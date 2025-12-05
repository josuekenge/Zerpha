import { createClient } from '@supabase/supabase-js';
import { logger } from '../logger.js';
// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// Track if config is valid
const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);
// Log configuration status (without exposing secrets)
console.log('🔧 Supabase Configuration:');
if (supabaseUrl) {
    console.log(`   URL: ${supabaseUrl}`);
}
else {
    console.warn('   ⚠️ SUPABASE_URL is not set!');
}
if (supabaseServiceRoleKey) {
    console.log(`   Service Role Key: ${supabaseServiceRoleKey.substring(0, 20)}...`);
}
else {
    console.warn('   ⚠️ SUPABASE_SERVICE_ROLE_KEY is not set!');
}
// Create the client - use dummy values if not configured (will fail on actual use)
const supabaseClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceRoleKey || 'placeholder-key', {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
if (isConfigured) {
    console.log('   ✅ Supabase client initialized');
}
else {
    console.warn('   ⚠️ Supabase client created with placeholder values (API calls will fail)');
}
/**
 * Admin client with service role key - use for writes
 */
export const supabaseAdmin = supabaseClient;
/**
 * Standard client - same as admin in backend context
 */
export const supabase = supabaseClient;
/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured() {
    return isConfigured;
}
/**
 * Verify Supabase connection on startup
 */
export async function verifySupabaseConnection() {
    if (!isConfigured) {
        console.warn('⚠️ Skipping Supabase verification (not configured)');
        return;
    }
    try {
        const { data, error } = await supabaseClient.from('searches').select('id').limit(1);
        if (error) {
            logger.warn({ err: error }, '[supabase] Verification query failed');
            console.warn('⚠️ Supabase verification query failed:', error.message);
        }
        else {
            console.info('✅ Supabase connection verified');
            logger.info('[supabase] Connection verified successfully');
        }
    }
    catch (err) {
        logger.warn({ err }, '[supabase] Unable to verify connection');
        console.warn('⚠️ Supabase connection check failed:', err.message);
    }
}
