import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  CLAUDE_API_KEY: z.string().min(1, 'CLAUDE_API_KEY is required'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GOOGLE_PROJECT_ID: z.string().optional().default(''),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional().default(''),
  GOOGLE_CLIENT_EMAIL: z.string().optional().default(''),
  GOOGLE_PRIVATE_KEY: z.string().optional().default(''),
  GOOGLE_SLIDES_TEMPLATE_ID: z.string().optional().default(''),
  APIFY_TOKEN: z.string().optional().default(''),
  FRONTEND_URL: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  GOOGLE_SLIDES_TEMPLATE_ID: process.env.GOOGLE_SLIDES_TEMPLATE_ID,
  APIFY_TOKEN: process.env.APIFY_TOKEN,
  FRONTEND_URL: process.env.FRONTEND_URL,
});

if (!parsed.success) {
  console.error('❌ Invalid or missing environment variables (continuing anyway):');
  for (const issue of parsed.error.issues) {
    console.error(`  • ${issue.path.join('.') || 'root'}: ${issue.message}`);
  }
  console.error(
    'Server will still start so Railway health checks pass, but API features may fail until env vars are fixed.',
  );
}

const fallbackEnv: Env = {
  NODE_ENV: (process.env.NODE_ENV as Env['NODE_ENV']) ?? 'development',
  PORT: Number(process.env.PORT) || 3001,
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ?? '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID ?? '',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL ?? '',
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ?? '',
  GOOGLE_SLIDES_TEMPLATE_ID: process.env.GOOGLE_SLIDES_TEMPLATE_ID ?? '',
  APIFY_TOKEN: process.env.APIFY_TOKEN ?? '',
  FRONTEND_URL: process.env.FRONTEND_URL ?? '',
};

export const env: Env = parsed.success ? parsed.data : fallbackEnv;
