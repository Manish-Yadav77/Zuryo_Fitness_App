import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 12),
    CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    SEED_PASSWORD: z.string().min(8).default('Demo@12345'),

    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),

    LLM_API_KEY: z.string().optional(),
    LLM_MODEL: z.string().default('gemini-3.8-flash'),
    NVIDIA_API_KEY: z.string().optional(),
    NVIDIA_MODEL: z.string().default('z-ai/glm-5.3-flash'),
    NVIDIA_BASE_URL: z.string().default('https://integrate.api.nvidia.com/v1'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && (!value.RAZORPAY_KEY_ID || !value.RAZORPAY_KEY_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: ['RAZORPAY_KEY_ID'],
        message: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in production',
      });
    }
  });

const cleaned = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''));

const parsed = envSchema.safeParse(cleaned);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  clientOrigins: parsed.data.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  isProduction: parsed.data.NODE_ENV === 'production',
};