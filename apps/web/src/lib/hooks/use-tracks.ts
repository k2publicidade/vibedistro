'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Track, PaginatedResponse, PaginationParams } from '../types';
import { releaseKeys } from './use-releases';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const trackKeys = {
  all: ['tracks'] as const,
  lists: () => [...trackKeys.all, 'list'] as const,
  list: (params: TrackListParams) => [...trackKeys.lists(), params] as const,
  details: () => [...trackKeys.all, 'detail'] as const,
  detail: (id: string) => [...trackKeys.details(), id] as const,
};

// ---- Params ----

export interface TrackListParams extends PaginationParams {
  releaseId?: string;
}

export interface CreateTrackBody {
  title: string;
  tenantId: string;
  releaseId?: string;
  version?: string;
  isrc?: string;
  explicit?: boolean;
  language?: string;
  durationMs?: number;
  bpm?: number;
  keySignature?: string;
  cLine?: string;
  pLine?: string;
  copyrightYear?: number;
  publisherName?: string;
  publishingIpi?: string;
}

export interface UpdateTrackBody extends Partial<Omit<CreateTrackBody, 'tenantId'>> {}

// ---- Queries ----

export function useTracks(
  params: TrackListParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Track>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: trackKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Track>>(
        `/tracks${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useTrack(
  id: string,
  options?: Omit<UseQueryOptions<Track>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: trackKeys.detail(id),
    queryFn: () => apiClient.get<Track>(`/tracks/${id}`, getToken()),
    enabled: !!id,
    ...options,
  });
}

// ---- Mutations ----

export function useCreateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTrackBody) =>
      apiClient.post<Track>('/tracks', body, getToken()),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: trackKeys.lists() });
      // Also invalidate the parent release detail if linked
      if (variables.releaseId) {
        qc.invalidateQueries({
          queryKey: releaseKeys.detail(variables.releaseId),
        });
      }
    },
  });
}

export function useUpdateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateTrackBody & { id: string }) =>
      apiClient.patch<Track>(`/tracks/${id}`, body, getToken()),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: trackKeys.lists() });
      qc.invalidateQueries({ queryKey: trackKeys.detail(variables.id) });
    },
  });
}
