import { z } from 'zod';
import { commonEnvSchema } from './common';
import { revelatorConfigSchema } from './provider';

export const workerEnvSchema = commonEnvSchema.merge(revelatorConfigSchema).extend({
  INTERNAL_API_KEY: z.string().default('vibedistro-internal-dev-key-32chars!'),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Job concurrency
  SYNC_RELEASE_CONCURRENCY: z.coerce.number().default(5),
  SYNC_ANALYTICS_CONCURRENCY: z.coerce.number().default(3),
  ASSET_PROCESSING_CONCURRENCY: z.coerce.number().default(2),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
