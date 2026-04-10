import type { Timestamps, ID } from '../common';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'STALE' | 'NOT_APPLICABLE';
export type ProviderEnvironment = 'SANDBOX' | 'STAGING' | 'PRODUCTION';
export type WebhookEventStatus = 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'SKIPPED' | 'DEAD_LETTERED';

export interface ExternalMapping extends Timestamps {
  id: ID;
  tenantId: ID;
  entityType: string;
  provider: string;
  environment: ProviderEnvironment;
  externalId: string;
  externalReference: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
}

export interface IntegrationHealth {
  provider: string;
  environment: ProviderEnvironment;
  healthy: boolean;
  lastCheckedAt: string | null;
  error: string | null;
}

export interface WebhookEvent extends Timestamps {
  id: ID;
  tenantId: ID | null;
  provider: string;
  environment: ProviderEnvironment;
  eventType: string;
  status: WebhookEventStatus;
  attempts: number;
  processedAt: string | null;
  failureReason: string | null;
}
