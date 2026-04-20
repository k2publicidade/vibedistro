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
  UploadedAssetRef,
} from '../provider.interface';
import { RevelatorAuthClient } from './auth.client';
import { RevelatorAdapter } from './adapter';
import type { RevelatorConfig } from './config';

/**
 * RevelatorProvider — implements DistributionProvider against the real Revelator API.
 *
 * Base URL: https://api.revelator.com (sandbox and production use the same host)
 * Auth: POST /account/loginpartner → Bearer token
 *
 * Key endpoints used:
 *   POST /content/release/save          — create or update release
 *   GET  /content/release/{id}          — get release details
 *   POST /distribution/release/addtoqueue — submit release to DSPs
 *   POST /distribution/release/takedown  — takedown release
 *   GET  /distribution/release/all       — check distribution status
 *   POST /content/artist/save           — create or update artist
 *   POST /content/track/save            — create or update track
 *   GET  /analytics/consumption/byRelease — stream analytics
 *   GET  /analytics/revenue/byRelease    — revenue analytics
 *   GET  /account/user                  — health check
 */
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
    this.adapter = new RevelatorAdapter();

    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });

    // Attach Bearer token before every request
    this.http.interceptors.request.use(async (req) => {
      const token = await authClient.getAccessToken();
      req.headers['Authorization'] = `Bearer ${token}`;
      return req;
    });

    // On 401: refresh token once, then retry
    this.http.interceptors.response.use(undefined, async (error: AxiosError) => {
      if (error.response?.status === 401 && error.config && !(error.config as any)._retried) {
        (error.config as any)._retried = true;
        await authClient.refresh();
        const token = await authClient.getAccessToken();
        error.config.headers = error.config.headers ?? {} as any;
        (error.config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        return this.http.request(error.config);
      }
      return Promise.reject(error);
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
        console.warn(`[Revelator] Retry ${retryCount} — ${error.config?.url}`);
      },
    });
  }

  async authenticate(): Promise<void> {
    await this.authClient.refresh();
  }

  async refreshAccessToken(): Promise<void> {
    await this.authClient.refresh();
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // /account/user requires auth and returns user data — good health signal
      await this.http.get('/account/user');
      return {
        healthy: true,
        latencyMs: Date.now() - start,
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown';
      return { healthy: false, error: message, checkedAt: new Date().toISOString() };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RELEASE MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  /**
   * Creates or updates a release in Revelator.
   * POST /content/release/save
   *
   * For new releases: omit releaseId (Revelator will assign one).
   * For updates: include releaseId in the payload.
   */
  async submitRelease(dto: InternalReleaseDTO): Promise<ExternalReleaseRef> {
    const enterpriseId = await this.authClient.getEnterpriseId();
    const payload = this.adapter.toRevelatorReleasePayload(dto, enterpriseId);

    const response = await this.http.post('/content/release/save', payload);
    const data = response.data as { releaseId?: number; id?: number };

    const releaseId = data.releaseId ?? data.id;
    if (!releaseId) {
      throw new Error('[Revelator] /content/release/save returned no releaseId');
    }

    // After save, add to distribution queue for configured DSPs
    if (dto.targetDsps && dto.targetDsps.length > 0) {
      const storeIds = this.adapter.dspNamesToStoreIds(dto.targetDsps);
      await this.http.post('/distribution/release/addtoqueue', storeIds, {
        params: { releaseId, suppressDeliveryEmail: false },
      });
    }

    return {
      externalId: String(releaseId),
      externalReference: String(releaseId),
      provider: this.providerName,
    };
  }

  async updateRelease(externalId: string, dto: Partial<InternalReleaseDTO>): Promise<void> {
    const enterpriseId = await this.authClient.getEnterpriseId();
    const payload = this.adapter.toRevelatorReleasePayload(
      { ...dto, internalId: externalId } as InternalReleaseDTO,
      enterpriseId,
      Number(externalId),
    );
    await this.http.post('/content/release/save', payload);
  }

  /**
   * Takedown a release from all or specific DSPs.
   * POST /distribution/release/takedown?releaseId=X
   * Body: [] (empty = all stores)
   */
  async takedownRelease(externalId: string, _reason?: string): Promise<void> {
    await this.http.post('/distribution/release/takedown', [], {
      params: { releaseId: Number(externalId) },
    });
  }

  /**
   * Get distribution status for a release.
   * GET /distribution/release/all?options.releaseId=X
   */
  async getReleaseStatus(externalId: string): Promise<ExternalStatusDTO> {
    const response = await this.http.get('/distribution/release/all', {
      params: { 'options.releaseId': Number(externalId), 'options.pageSize': 1 },
    });

    const data = response.data as { items?: unknown[] };
    const item = data.items?.[0] as Record<string, unknown> | undefined;

    return this.adapter.fromRevelatorDistributionStatus(item);
  }

  // ─────────────────────────────────────────────────────────────
  // MEDIA UPLOAD (pass-through)
  // ─────────────────────────────────────────────────────────────

  /**
   * Upload audio file to Revelator.
   * POST /media/audio/upload (or /upload/wav, /upload/flac by mime)
   * Returns { fileId, filename } referenced in track payloads.
   */
  async uploadAudio(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<UploadedAssetRef> {
    const endpoint = mimeType.includes('flac')
      ? '/media/audio/upload/flac'
      : mimeType.includes('wav')
      ? '/media/audio/upload/wav'
      : '/media/audio/upload';

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }), filename);

    const response = await this.http.post(endpoint, form, {
      headers: { 'Content-Type': undefined as unknown as string },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 10 * 60 * 1000, // 10min for WAV masters
    });

    const data = response.data as { fileId?: string; filename?: string };
    if (!data.fileId) {
      throw new Error(`[Revelator] ${endpoint} returned no fileId`);
    }
    return { fileId: data.fileId, filename: data.filename ?? filename };
  }

  /**
   * Upload image (cover art / artist photo) to Revelator.
   * POST /media/image/upload?cover=true
   * Response is a bare string (the fileId) per the public spec.
   */
  async uploadImage(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    isCover: boolean = true,
  ): Promise<UploadedAssetRef> {
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }), filename);

    const response = await this.http.post('/media/image/upload', form, {
      headers: { 'Content-Type': undefined as unknown as string },
      params: { cover: isCover },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 2 * 60 * 1000,
    });

    const fileId =
      typeof response.data === 'string'
        ? response.data.replace(/^"|"$/g, '')
        : (response.data as { fileId?: string })?.fileId;

    if (!fileId) {
      throw new Error('[Revelator] /media/image/upload returned no fileId');
    }
    return { fileId, filename };
  }

  // ─────────────────────────────────────────────────────────────
  // ANALYTICS
  // ─────────────────────────────────────────────────────────────

  /**
   * Stream consumption analytics.
   * GET /analytics/consumption/byRelease
   */
  async getAnalytics(params: AnalyticsQueryDTO): Promise<AnalyticsResultDTO> {
    const [consumptionResp, revenueResp] = await Promise.all([
      this.http.get('/analytics/consumption/byRelease', {
        params: this.adapter.toRevelatorAnalyticsParams(params),
      }),
      this.http.get('/analytics/revenue/byRelease', {
        params: this.adapter.toRevelatorAnalyticsParams(params),
      }),
    ]);

    return this.adapter.fromRevelatorAnalytics(consumptionResp.data, revenueResp.data);
  }

  /**
   * Revenue statement for a period.
   * GET /analytics/revenue/metricsByDate with period filter
   */
  async getStatement(params: StatementQueryDTO): Promise<StatementResultDTO> {
    const response = await this.http.get('/analytics/revenue/metricsByDate', {
      params: this.adapter.toRevelatorStatementParams(params),
    });

    return this.adapter.fromRevelatorStatement(params.period, response.data);
  }

  // ─────────────────────────────────────────────────────────────
  // CONTENT LISTING (for sync)
  // ─────────────────────────────────────────────────────────────

  async listArtists(pageSize = 100): Promise<Array<Record<string, unknown>>> {
    const response = await this.http.get('/content/artist/all', {
      params: { 'options.pageSize': pageSize },
    });
    const data = response.data as { items?: unknown[] } | unknown[];
    return (Array.isArray(data) ? data : (data.items ?? [])) as Array<Record<string, unknown>>;
  }

  async listReleases(pageSize = 100): Promise<Array<Record<string, unknown>>> {
    const response = await this.http.get('/content/release/all', {
      params: { 'options.pageSize': pageSize },
    });
    const data = response.data as { items?: unknown[] } | unknown[];
    return (Array.isArray(data) ? data : (data.items ?? [])) as Array<Record<string, unknown>>;
  }

  async listTracks(pageSize = 100): Promise<Array<Record<string, unknown>>> {
    const response = await this.http.get('/content/track/all', {
      params: { 'options.pageSize': pageSize },
    });
    const data = response.data as { items?: unknown[] } | unknown[];
    return (Array.isArray(data) ? data : (data.items ?? [])) as Array<Record<string, unknown>>;
  }

  // ─────────────────────────────────────────────────────────────
  // WEBHOOKS
  // ─────────────────────────────────────────────────────────────

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    if (!this.config.webhookSecret) return false;

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
