'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { AuditLog, PaginatedResponse, PaginationParams } from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (params: AuditListParams) => [...auditKeys.lists(), params] as const,
  actions: () => [...auditKeys.all, 'actions'] as const,
};

// ---- Params ----

export interface AuditListParams extends PaginationParams {
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---- Queries ----

export function useAuditLogs(
  params: AuditListParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<AuditLog>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<AuditLog>>(
        `/audit${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useAuditActions(
  options?: Omit<UseQueryOptions<string[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: auditKeys.actions(),
    queryFn: () =>
      apiClient.get<string[]>('/audit/actions', getToken()),
    staleTime: 5 * 60 * 1000, // actions rarely change, cache 5 min
    ...options,
  });
}
