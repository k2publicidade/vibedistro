import { z } from 'zod';
import { commonEnvSchema } from './common.js';
import { revelatorConfigSchema } from './provider.js';

export const workerEnvSchema = commonEnvSchema.merge(revelatorConfigSchema).extend({
  INTERNAL_API_KEY: z.string().min(32),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Job concurrency
  SYNC_RELEASE_CONCURRENCY: z.coerce.number().default(5),
  SYNC_ANALYTICS_CONCURRENCY: z.coerce.number().default(3),
  ASSET_PROCESSING_CONCURRENCY: z.coerce.number().default(2),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
