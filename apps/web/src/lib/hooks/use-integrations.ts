'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  IntegrationStatus,
  IntegrationHealth,
  SyncRecord,
  WebhookEvent,
  ExternalMapping,
  SyncStatus,
  PaginatedResponse,
  PaginationParams,
} from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const integrationKeys = {
  all: ['integrations'] as const,
  status: () => [...integrationKeys.all, 'status'] as const,
  health: () => [...integrationKeys.all, 'health'] as const,
  syncHistory: (type?: string) =>
    [...integrationKeys.all, 'sync-history', type] as const,
  failedWebhooks: (params: FailedWebhooksParams) =>
    [...integrationKeys.all, 'webhooks-failed', params] as const,
  mappings: (params: MappingsParams) =>
    [...integrationKeys.all, 'mappings', params] as const,
};

// ---- Params ----

export interface FailedWebhooksParams extends PaginationParams {}

export interface MappingsParams extends PaginationParams {
  entityType?: string;
  syncStatus?: SyncStatus;
}

export interface RevelatorAuthorizeUrlPayload {
  redirectUrl?: string;
}

export interface RevelatorAuthorizeUrlResult {
  url: string;
}

// ---- Queries ----

export function useIntegrationStatus(
  options?: Omit<
    UseQueryOptions<IntegrationStatus>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: integrationKeys.status(),
    queryFn: () =>
      apiClient.get<IntegrationStatus>(
        '/integrations/status',
        getToken(),
      ),
    ...options,
  });
}

export function useIntegrationHealth(
  options?: Omit<
    UseQueryOptions<IntegrationHealth>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: integrationKeys.health(),
    queryFn: () =>
      apiClient.get<IntegrationHealth>(
        '/integrations/health',
        getToken(),
      ),
    refetchInterval: 30_000, // poll health every 30s
    ...options,
  });
}

export function useSyncHistory(
  type?: string,
  options?: Omit<
    UseQueryOptions<{ data: SyncRecord[] }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: integrationKeys.syncHistory(type),
    queryFn: () =>
      apiClient.get<{ data: SyncRecord[] }>(
        `/integrations/sync-history${buildQuery({ type })}`,
        getToken(),
      ),
    ...options,
  });
}

export function useFailedWebhooks(
  params: FailedWebhooksParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<WebhookEvent>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: integrationKeys.failedWebhooks(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<WebhookEvent>>(
        `/integrations/webhooks/failed${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useExternalMappings(
  params: MappingsParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ExternalMapping>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: integrationKeys.mappings(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ExternalMapping>>(
        `/integrations/mappings${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

// ---- Mutations ----

export function useRetryWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<WebhookEvent>(
        `/integrations/webhooks/${id}/retry`,
        {},
        getToken(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...integrationKeys.all, 'webhooks-failed'],
      });
    },
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type: string) =>
      apiClient.post<{ jobId: string }>(
        `/integrations/sync/${type}`,
        {},
        getToken(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...integrationKeys.all, 'sync-history'],
      });
      qc.invalidateQueries({ queryKey: integrationKeys.status() });
    },
  });
}

export function useCreateRevelatorAuthorizeUrl() {
  return useMutation({
    mutationFn: (payload: RevelatorAuthorizeUrlPayload = {}) =>
      apiClient.post<RevelatorAuthorizeUrlResult>(
        '/integrations/revelator/authorize-url',
        payload,
        getToken(),
      ),
  });
}
