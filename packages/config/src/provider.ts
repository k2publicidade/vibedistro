import { z } from 'zod';

export const providerEnvironmentSchema = z.enum(['sandbox', 'production']);
export type ProviderEnvironment = z.infer<typeof providerEnvironmentSchema>;

/**
 * Revelator API credentials.
 * Auth: POST /account/loginpartner { partnerApiKey, partnerUserId } → Bearer token
 * Base URL: https://api.revelator.com (same for sandbox and production)
 */
export const revelatorConfigSchema = z.object({
  REVELATOR_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  REVELATOR_ENVIRONMENT: providerEnvironmentSchema.default('sandbox'),

  // Unique base URL — sandbox and production are the same host
  REVELATOR_API_URL: z.string().url().default('https://api.revelator.com'),

  // Partner credentials (UUID key + opaque user ID)
  REVELATOR_PARTNER_API_KEY: z.string().uuid(),
  REVELATOR_PARTNER_USER_ID: z.string().min(1),

  // Optional: pin enterpriseId instead of resolving from login
  REVELATOR_ENTERPRISE_ID: z.coerce.number().default(0),

  // HMAC secret for webhook signature verification
  REVELATOR_WEBHOOK_SECRET: z.string().default(''),

  // HTTP retry config
  REVELATOR_TIMEOUT_MS: z.coerce.number().default(30_000),
  REVELATOR_MAX_RETRIES: z.coerce.number().default(3),
  REVELATOR_RETRY_DELAY_MS: z.coerce.number().default(1_000),
});

export type RevelatorEnvConfig = z.infer<typeof revelatorConfigSchema>;

export const revelatorSandboxDefaults = {
  REVELATOR_API_URL: 'https://api.revelator.com',
  REVELATOR_ENVIRONMENT: 'sandbox' as ProviderEnvironment,
  REVELATOR_ENTERPRISE_ID: 893945,
  REVELATOR_TIMEOUT_MS: 30_000,
  REVELATOR_MAX_RETRIES: 3,
  REVELATOR_RETRY_DELAY_MS: 1_000,
} as const;
