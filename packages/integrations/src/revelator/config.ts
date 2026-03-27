import type { ProviderEnvironment } from '@vibedistro/types';

export interface RevelatorConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  environment: ProviderEnvironment;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  enabled: boolean;
}

const envBaseUrls: Record<string, string> = {
  SANDBOX: 'https://sandbox.api.revelator.com',
  STAGING: 'https://staging.api.revelator.com',
  PRODUCTION: 'https://api.revelator.com',
};

export function createRevelatorConfig(env: NodeJS.ProcessEnv = process.env): RevelatorConfig {
  const environment = (env['PROVIDER_ENV'] ?? 'sandbox').toUpperCase() as ProviderEnvironment;
  const baseUrl = env['REVELATOR_BASE_URL'] ?? envBaseUrls[environment] ?? envBaseUrls['SANDBOX']!;

  return {
    baseUrl,
    clientId: env['REVELATOR_CLIENT_ID'] ?? '',
    clientSecret: env['REVELATOR_CLIENT_SECRET'] ?? '',
    webhookSecret: env['REVELATOR_WEBHOOK_SECRET'] ?? '',
    environment,
    timeoutMs: Number(env['REVELATOR_TIMEOUT_MS'] ?? 30_000),
    maxRetries: Number(env['REVELATOR_MAX_RETRIES'] ?? 3),
    retryDelayMs: Number(env['REVELATOR_RETRY_DELAY_MS'] ?? 1_000),
    enabled: env['PROVIDER_ENABLED'] === 'true',
  };
}
