'use client';

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  RoyaltySummary,
  RoyaltyStatement,
  RoyaltyByArtist,
  RoyaltyByPlatform,
  RoyaltyStatementStatus,
  PaginatedResponse,
  PaginationParams,
} from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const royaltyKeys = {
  all: ['royalties'] as const,
  summary: (period?: string) =>
    [...royaltyKeys.all, 'summary', period] as const,
  statements: () => [...royaltyKeys.all, 'statements'] as const,
  statementList: (params: StatementListParams) =>
    [...royaltyKeys.statements(), 'list', params] as const,
  statementDetail: (id: string) =>
    [...royaltyKeys.statements(), 'detail', id] as const,
  byArtist: (period?: string) =>
    [...royaltyKeys.all, 'by-artist', period] as const,
  byPlatform: (period?: string) =>
    [...royaltyKeys.all, 'by-platform', period] as const,
};

// ---- Params ----

export interface StatementListParams extends PaginationParams {
  period?: string;
  artistId?: string;
  status?: RoyaltyStatementStatus;
}

// ---- Queries ----

export function useRoyaltiesSummary(
  period?: string,
  options?: Omit<UseQueryOptions<RoyaltySummary>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: royaltyKeys.summary(period),
    queryFn: () =>
      apiClient.get<RoyaltySummary>(
        `/royalties/summary${buildQuery({ period })}`,
        getToken(),
      ),
    ...options,
  });
}

export function useRoyaltyStatements(
  params: StatementListParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<RoyaltyStatement>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: royaltyKeys.statementList(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<RoyaltyStatement>>(
        `/royalties/statements${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useRoyaltyStatement(
  id: string,
  options?: Omit<
    UseQueryOptions<RoyaltyStatement>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: royaltyKeys.statementDetail(id),
    queryFn: () =>
      apiClient.get<RoyaltyStatement>(
        `/royalties/statements/${id}`,
        getToken(),
      ),
    enabled: !!id,
    ...options,
  });
}

export function useRoyaltiesByArtist(
  period?: string,
  options?: Omit<
    UseQueryOptions<{ data: RoyaltyByArtist[] }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: royaltyKeys.byArtist(period),
    queryFn: () =>
      apiClient.get<{ data: RoyaltyByArtist[] }>(
        `/royalties/by-artist${buildQuery({ period })}`,
        getToken(),
      ),
    ...options,
  });
}

export function useRoyaltiesByPlatform(
  period?: string,
  options?: Omit<
    UseQueryOptions<{ data: RoyaltyByPlatform[] }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: royaltyKeys.byPlatform(period),
    queryFn: () =>
      apiClient.get<{ data: RoyaltyByPlatform[] }>(
        `/royalties/by-platform${buildQuery({ period })}`,
        getToken(),
      ),
    ...options,
  });
}

// ---- Mutations ----

export function useSyncRoyalties() {
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ jobId: string }>(
        '/royalties/sync',
        {},
        getToken(),
      ),
  });
}
