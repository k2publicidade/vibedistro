import { z } from 'zod';
import { commonEnvSchema } from './common.js';
import { revelatorConfigSchema } from './provider.js';

export const apiEnvSchema = commonEnvSchema.merge(revelatorConfigSchema).extend({
  PORT: z.coerce.number().default(3001),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  // Storage (S3-compatible)
  STORAGE_PROVIDER: z.enum(['s3', 'r2', 'minio']).default('s3'),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_ENDPOINT: z.string().url().optional(), // For MinIO/R2 custom endpoints
  STORAGE_CDN_URL: z.string().url().optional(),

  // Internal
  INTERNAL_API_KEY: z.string().min(32), // Worker → API auth
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
