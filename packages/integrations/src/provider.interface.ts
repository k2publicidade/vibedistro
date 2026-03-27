// ============================================================
// Generic DistributionProvider interface
// The core NEVER imports RevelatorProvider directly.
// ============================================================

export interface HealthStatus {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: string;
}

// ---- Internal DTOs (decoupled from any provider payload) ----

export interface InternalArtistDTO {
  internalId: string;
  stageName: string;
  legalName: string;
  country?: string;
  isni?: string;
  ipiNumber?: string;
  spotifyId?: string;
  appleMusicId?: string;
}

export interface InternalTrackDTO {
  internalId: string;
  title: string;
  version?: string;
  isrc?: string;
  explicit: boolean;
  language?: string;
  durationMs?: number;
  bpm?: number;
  cLine?: string;
  pLine?: string;
  copyrightYear?: number;
  contributors: Array<{
    name: string;
    role: string;
    ipiNumber?: string;
    splitPercentage?: number;
  }>;
  audioStorageKey: string;
}

export interface InternalReleaseDTO {
  internalId: string;
  title: string;
  version?: string;
  releaseType: string;
  upc?: string;
  releaseDate?: string;
  genre?: string;
  subgenre?: string;
  language?: string;
  explicit: boolean;
  cLine?: string;
  pLine?: string;
  copyrightYear?: number;
  artist: InternalArtistDTO;
  coverStorageKey: string;
  tracks: InternalTrackDTO[];
  targetDsps: string[];
  countryRestrictions?: Array<{ country: string; restricted: boolean }>;
}

export interface ExternalReleaseRef {
  externalId: string;
  externalReference?: string;
  provider?: string;
}

export interface ExternalStatusDTO {
  externalId: string;
  status: string;
  message?: string;
  liveUrls?: Record<string, string>; // dspName → URL
  updatedAt: string;
}

export interface AnalyticsQueryDTO {
  from: string;
  to: string;
  externalReleaseId?: string;
  externalTrackId?: string;
  dsp?: string;
  territory?: string;
}

export interface AnalyticsResultDTO {
  totalStreams: number;
  totalRevenueCents: number;
  currency: string;
  byDsp: Array<{ dsp: string; streams: number; revenueCents: number }>;
  byTerritory: Array<{ territory: string; streams: number }>;
  byDay: Array<{ date: string; streams: number; revenueCents: number }>;
}

export interface StatementQueryDTO {
  period: string; // e.g. "2025-Q1"
  externalArtistId?: string;
}

export interface StatementResultDTO {
  externalStatementId: string;
  period: string;
  totalRevenueCents: number;
  currency: string;
  entries: Array<{
    externalTrackId?: string;
    isrc?: string;
    upc?: string;
    dsp: string;
    territory: string;
    streams: number;
    revenueCents: number;
  }>;
}

export interface InternalWebhookEventDTO {
  eventType: string;
  entityId?: string;
  entityType: 'release' | 'track' | 'artist' | 'statement';
  data: Record<string, unknown>;
  rawPayload: unknown;
  receivedAt: string;
}

// ---- The provider contract ----

export interface DistributionProvider {
  readonly providerName: string;
  readonly environment: string;

  // Auth lifecycle
  authenticate(): Promise<void>;
  refreshAccessToken(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;

  // Catalog delivery
  submitRelease(dto: InternalReleaseDTO): Promise<ExternalReleaseRef>;
  updateRelease(externalId: string, dto: Partial<InternalReleaseDTO>): Promise<void>;
  takedownRelease(externalId: string, reason?: string): Promise<void>;
  getReleaseStatus(externalId: string): Promise<ExternalStatusDTO>;

  // Analytics
  getAnalytics(params: AnalyticsQueryDTO): Promise<AnalyticsResultDTO>;

  // Royalties
  getStatement(params: StatementQueryDTO): Promise<StatementResultDTO>;

  // Webhooks
  verifyWebhookSignature(payload: Buffer, signature: string): boolean;
  parseWebhookEvent(rawPayload: unknown): InternalWebhookEventDTO;
}
