'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  Artist,
  PaginatedResponse,
  PaginationParams,
  SortParams,
} from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const artistKeys = {
  all: ['artists'] as const,
  lists: () => [...artistKeys.all, 'list'] as const,
  list: (params: ArtistListParams) =>
    [...artistKeys.lists(), params] as const,
  details: () => [...artistKeys.all, 'detail'] as const,
  detail: (id: string) => [...artistKeys.details(), id] as const,
};

// ---- Params ----

export interface ArtistListParams extends PaginationParams, SortParams {
  search?: string;
}

export interface CreateArtistBody {
  stageName: string;
  legalName: string;
  genre?: string;
  bio?: string;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  spotifyId?: string;
  appleMusicId?: string;
  instagramHandle?: string;
  websiteUrl?: string;
}

export interface UpdateArtistBody extends Partial<CreateArtistBody> {}

// ---- Queries ----

export function useArtists(
  params: ArtistListParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Artist>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: artistKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Artist>>(
        `/artists${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useArtist(
  id: string,
  options?: Omit<UseQueryOptions<Artist>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: artistKeys.detail(id),
    queryFn: () => apiClient.get<Artist>(`/artists/${id}`, getToken()),
    enabled: !!id,
    ...options,
  });
}

// ---- Mutations ----

export function useCreateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateArtistBody) =>
      apiClient.post<Artist>('/artists', body, getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: artistKeys.lists() });
    },
  });
}

export function useUpdateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateArtistBody & { id: string }) =>
      apiClient.patch<Artist>(`/artists/${id}`, body, getToken()),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: artistKeys.lists() });
      qc.invalidateQueries({ queryKey: artistKeys.detail(variables.id) });
    },
  });
}

export function useDeleteArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/artists/${id}`, getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: artistKeys.lists() });
    },
  });
}
