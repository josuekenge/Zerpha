import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  CLAUDE_API_KEY: z.string().min(1, 'CLAUDE_API_KEY is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GOOGLE_PROJECT_ID: z.string().min(1, 'GOOGLE_PROJECT_ID is required'),
  GOOGLE_APPLICATION_CREDENTIALS: z
    .string()
    .min(1, 'GOOGLE_APPLICATION_CREDENTIALS path is required'),
  GOOGLE_CLIENT_EMAIL: z.string().email('GOOGLE_CLIENT_EMAIL must be a valid email'),
  GOOGLE_PRIVATE_KEY: z.string().min(1, 'GOOGLE_PRIVATE_KEY is required'),
  GOOGLE_SLIDES_TEMPLATE_ID: z.string().min(1, 'GOOGLE_SLIDES_TEMPLATE_ID is required'),
  APIFY_TOKEN: z.string().optional(),
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
});

if (!parsed.success) {
  console.error('❌ Invalid or missing environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  • ${issue.path.join('.') || 'root'}: ${issue.message}`);
  }
  throw new Error('Failed to load environment variables. Check your .env file.');
}

export const env: Env = parsed.data;
