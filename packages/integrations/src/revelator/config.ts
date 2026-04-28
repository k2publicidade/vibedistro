export type RevelatorEnvironment = 'sandbox' | 'production';

export interface RevelatorConfig {
  /** https://api.revelator.com (única URL — sandbox e production usam o mesmo host) */
  baseUrl: string;
  /** UUID da chave de API do parceiro (REVELATOR_PARTNER_API_KEY) */
  partnerApiKey: string;
  /** ID do usuário parceiro/admin (REVELATOR_PARTNER_USER_ID) */
  partnerUserId: string;
  /** Segredo para verificação de webhook HMAC */
  webhookSecret: string;
  /** Identifica o contexto logado para rastreamento de ExternalMapping */
  environment: RevelatorEnvironment;
  /** Enterprise ID da conta sandbox/production obtido no login */
  enterpriseId: number;
  /** Timeout em ms para chamadas HTTP */
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  /** Flag para habilitar/desabilitar integração sem precisar remover configurações */
  enabled: boolean;
  /** White-label Revelator v2 URL used for browser authorize redirects */
  whiteLabelUrl?: string;
}

export function createRevelatorConfig(env: NodeJS.ProcessEnv = process.env): RevelatorConfig {
  const environment: RevelatorEnvironment =
    (env['REVELATOR_ENVIRONMENT'] ?? 'sandbox') === 'production' ? 'production' : 'sandbox';

  return {
    baseUrl: env['REVELATOR_API_URL'] ?? 'https://api.revelator.com',
    partnerApiKey: env['REVELATOR_PARTNER_API_KEY'] ?? '',
    partnerUserId: env['REVELATOR_PARTNER_USER_ID'] ?? '',
    webhookSecret: env['REVELATOR_WEBHOOK_SECRET'] ?? '',
    environment,
    // Will be populated at runtime after login; fallback 0 means config not yet resolved
    enterpriseId: Number(env['REVELATOR_ENTERPRISE_ID'] ?? 0),
    timeoutMs: Number(env['REVELATOR_TIMEOUT_MS'] ?? 30_000),
    maxRetries: Number(env['REVELATOR_MAX_RETRIES'] ?? 3),
    retryDelayMs: Number(env['REVELATOR_RETRY_DELAY_MS'] ?? 1_000),
    enabled: env['REVELATOR_ENABLED'] === 'true',
    whiteLabelUrl: env['REVELATOR_WHITE_LABEL_URL'],
  };
}
