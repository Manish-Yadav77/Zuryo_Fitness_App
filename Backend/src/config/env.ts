import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().default(43200),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  SEED_PASSWORD: z.string().default('Demo@12345'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gemini-2.5-flash'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

const clientOrigins = parsed.data.CLIENT_ORIGIN.split(',').map((o) => o.trim());

export const env = {
  ...parsed.data,
  clientOrigins,
  isProduction: parsed.data.NODE_ENV === 'production',
};