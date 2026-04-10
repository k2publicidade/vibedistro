import { z } from 'zod';
import { commonEnvSchema } from './common';
import { revelatorConfigSchema } from './provider';

export const apiEnvSchema = commonEnvSchema.merge(revelatorConfigSchema).extend({
  PORT: z.coerce.number().default(3001),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  // Storage (S3-compatible) — optional for local dev
  STORAGE_PROVIDER: z.enum(['s3', 'r2', 'minio', 'local']).default('local'),
  STORAGE_BUCKET: z.string().default('vibedistro-local'),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ACCESS_KEY: z.string().default(''),
  STORAGE_SECRET_KEY: z.string().default(''),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_CDN_URL: z.string().url().optional(),

  // Internal
  INTERNAL_API_KEY: z.string().default('vibedistro-internal-dev-key-32chars!'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
