import axios, { type AxiosInstance, type AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { createHmac, timingSafeEqual } from 'crypto';
import type {
  DistributionProvider,
  HealthStatus,
  InternalReleaseDTO,
  ExternalReleaseRef,
  ExternalStatusDTO,
  AnalyticsQueryDTO,
  AnalyticsResultDTO,
  StatementQueryDTO,
  StatementResultDTO,
  InternalWebhookEventDTO,
} from '../provider.interface.js';
import { RevelatorAuthClient } from './auth.client.js';
import type { RevelatorConfig } from './config.js';
import { RevelatorAdapter } from './adapter.js';

export class RevelatorProvider implements DistributionProvider {
  readonly providerName = 'revelator';
  readonly environment: string;

  private readonly http: AxiosInstance;
  private readonly adapter: RevelatorAdapter;

  constructor(
    private readonly config: RevelatorConfig,
    private readonly authClient: RevelatorAuthClient,
  ) {
    this.environment = config.environment;

    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
    });

    // Attach auth token to every request
    this.http.interceptors.request.use(async (req) => {
      const token = await authClient.getAccessToken();
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['X-Provider-Env'] = config.environment;
      return req;
    });

    // Retry on 429 / 5xx
    axiosRetry(this.http, {
      retries: config.maxRetries,
      retryDelay: (retryCount) => retryCount * config.retryDelayMs,
      retryCondition: (error: AxiosError) => {
        const status = error.response?.status;
        return status === 429 || (status !== undefined && status >= 500);
      },
      onRetry: (retryCount, error) => {
        console.warn(`[Revelator] Retry ${retryCount} for ${error.config?.url}`);
      },
    });

    this.adapter = new RevelatorAdapter();
  }

  async authenticate(): Promise<void> {
    this.authClient.invalidate();
    await this.authClient.getAccessToken();
  }

  async refreshAccessToken(): Promise<void> {
    this.authClient.invalidate();
    await this.authClient.getAccessToken();
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await this.http.get('/health');
      return { healthy: true, latencyMs: Date.now() - start, checkedAt: new Date().toISOString() };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { healthy: false, error: message, checkedAt: new Date().toISOString() };
    }
  }

  async submitRelease(dto: InternalReleaseDTO): Promise<ExternalReleaseRef> {
    const payload = this.adapter.toRevelatorReleasePayload(dto);
    const response = await this.http.post('/v1/releases', payload);
    return this.adapter.fromRevelatorReleaseRef(response.data);
  }

  async updateRelease(externalId: string, dto: Partial<InternalReleaseDTO>): Promise<void> {
    const payload = this.adapter.toRevelatorReleasePayload(dto as InternalReleaseDTO);
    await this.http.patch(`/v1/releases/${externalId}`, payload);
  }

  async takedownRelease(externalId: string, reason?: string): Promise<void> {
    await this.http.post(`/v1/releases/${externalId}/takedown`, { reason });
  }

  async getReleaseStatus(externalId: string): Promise<ExternalStatusDTO> {
    const response = await this.http.get(`/v1/releases/${externalId}`);
    return this.adapter.fromRevelatorStatus(response.data);
  }

  async getAnalytics(params: AnalyticsQueryDTO): Promise<AnalyticsResultDTO> {
    const response = await this.http.get('/v1/analytics', {
      params: this.adapter.toRevelatorAnalyticsParams(params),
    });
    return this.adapter.fromRevelatorAnalytics(response.data);
  }

  async getStatement(params: StatementQueryDTO): Promise<StatementResultDTO> {
    const response = await this.http.get('/v1/royalties/statements', {
      params: this.adapter.toRevelatorStatementParams(params),
    });
    return this.adapter.fromRevelatorStatement(response.data);
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    const expected = createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
    const expectedBuf = Buffer.from(`sha256=${expected}`);
    const receivedBuf = Buffer.from(signature);
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  }

  parseWebhookEvent(rawPayload: unknown): InternalWebhookEventDTO {
    return this.adapter.fromRevelatorWebhookPayload(rawPayload);
  }
}
