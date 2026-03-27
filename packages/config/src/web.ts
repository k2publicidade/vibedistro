import { z } from 'zod';

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_PROVIDER_ENV: z.enum(['sandbox', 'staging', 'production']).default('sandbox'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
