'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  Release,
  ReleaseStatus,
  ReleaseType,
  PaginatedResponse,
  PaginationParams,
  SortParams,
} from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const releaseKeys = {
  all: ['releases'] as const,
  lists: () => [...releaseKeys.all, 'list'] as const,
  list: (params: ReleaseListParams) =>
    [...releaseKeys.lists(), params] as const,
  details: () => [...releaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...releaseKeys.details(), id] as const,
};

// ---- Params ----

export interface ReleaseListParams extends PaginationParams, SortParams {
  status?: ReleaseStatus;
  artistId?: string;
}

export interface CreateReleaseBody {
  title: string;
  artistId: string;
  releaseType: ReleaseType;
  genre?: string;
  subgenre?: string;
  releaseDate?: string;
  language?: string;
  explicit?: boolean;
  cLine?: string;
  pLine?: string;
  copyrightYear?: number;
  version?: string;
  catalogNumber?: string;
}

export interface UpdateReleaseBody extends Partial<CreateReleaseBody> {}

// ---- Queries ----

export function useReleases(
  params: ReleaseListParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Release>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: releaseKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Release>>(
        `/releases${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useRelease(
  id: string,
  options?: Omit<UseQueryOptions<Release>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: releaseKeys.detail(id),
    queryFn: () => apiClient.get<Release>(`/releases/${id}`, getToken()),
    enabled: !!id,
    ...options,
  });
}

// ---- Mutations ----

export function useCreateRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReleaseBody) =>
      apiClient.post<Release>('/releases', body, getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: releaseKeys.lists() });
    },
  });
}

export function useUpdateRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateReleaseBody & { id: string }) =>
      apiClient.patch<Release>(`/releases/${id}`, body, getToken()),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: releaseKeys.lists() });
      qc.invalidateQueries({ queryKey: releaseKeys.detail(variables.id) });
    },
  });
}

export function useDeleteRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/releases/${id}`, getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: releaseKeys.lists() });
    },
  });
}

export function useTransitionReleaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.post<Release>(
        `/releases/${id}/status`,
        { status },
        getToken(),
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: releaseKeys.lists() });
      qc.invalidateQueries({ queryKey: releaseKeys.detail(variables.id) });
    },
  });
}

export function useSubmitRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Release>(`/releases/${id}/submit`, {}, getToken()),
    onSuccess: (_data, _variables, _context) => {
      qc.invalidateQueries({ queryKey: releaseKeys.lists() });
      qc.invalidateQueries({ queryKey: releaseKeys.detail(_variables) });
    },
  });
}
