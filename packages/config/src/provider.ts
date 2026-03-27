import { z } from 'zod';

export const providerEnvironmentSchema = z.enum(['sandbox', 'staging', 'production']);
export type ProviderEnvironment = z.infer<typeof providerEnvironmentSchema>;

export const revelatorConfigSchema = z.object({
  PROVIDER_ENV: providerEnvironmentSchema.default('sandbox'),
  PROVIDER_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Revelator API
  REVELATOR_BASE_URL: z.string().url(),
  REVELATOR_CLIENT_ID: z.string().min(1),
  REVELATOR_CLIENT_SECRET: z.string().min(1),
  REVELATOR_WEBHOOK_SECRET: z.string().min(1),

  // Retry config
  REVELATOR_TIMEOUT_MS: z.coerce.number().default(30_000),
  REVELATOR_MAX_RETRIES: z.coerce.number().default(3),
  REVELATOR_RETRY_DELAY_MS: z.coerce.number().default(1_000),
});

export type RevelatorConfig = z.infer<typeof revelatorConfigSchema>;

export const revelatorSandboxDefaults = {
  REVELATOR_BASE_URL: 'https://sandbox.api.revelator.com',
  REVELATOR_TIMEOUT_MS: 30_000,
  REVELATOR_MAX_RETRIES: 3,
  REVELATOR_RETRY_DELAY_MS: 1_000,
} as const;
