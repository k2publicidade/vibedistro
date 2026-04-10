'use client';

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  AnalyticsOverview,
  StreamDataPoint,
  TopRelease,
  TopTrack,
  PlatformAnalytics,
} from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (period?: string) =>
    [...analyticsKeys.all, 'overview', period] as const,
  streams: (params: StreamsParams) =>
    [...analyticsKeys.all, 'streams', params] as const,
  topReleases: (params: TopParams) =>
    [...analyticsKeys.all, 'top-releases', params] as const,
  topTracks: (params: TopParams) =>
    [...analyticsKeys.all, 'top-tracks', params] as const,
  platforms: (period?: string) =>
    [...analyticsKeys.all, 'platforms', period] as const,
};

// ---- Params ----

export interface StreamsParams {
  period?: string;
  artistId?: string;
  releaseId?: string;
}

export interface TopParams {
  period?: string;
  limit?: number;
}

// ---- Queries ----

export function useAnalyticsOverview(
  period?: string,
  options?: Omit<
    UseQueryOptions<AnalyticsOverview>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: analyticsKeys.overview(period),
    queryFn: () =>
      apiClient.get<AnalyticsOverview>(
        `/analytics/overview${buildQuery({ period })}`,
        getToken(),
      ),
    ...options,
  });
}

export function useAnalyticsStreams(
  params: StreamsParams = {},
  options?: Omit<
    UseQueryOptions<{ data: StreamDataPoint[] }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: analyticsKeys.streams(params),
    queryFn: () =>
      apiClient.get<{ data: StreamDataPoint[] }>(
        `/analytics/streams${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useTopReleases(
  params: TopParams = {},
  options?: Omit<
    UseQueryOptions<{ data: TopRelease[] }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: analyticsKeys.topReleases(params),
    queryFn: () =>
      apiClient.get<{ data: TopRelease[] }>(
        `/analytics/top-releases${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useTopTracks(
  params: TopParams = {},
  options?: Omit<
    UseQueryOptions<{ data: TopTrack[] }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: analyticsKeys.topTracks(params),
    queryFn: () =>
      apiClient.get<{ data: TopTrack[] }>(
        `/analytics/top-tracks${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useAnalyticsPlatforms(
  period?: string,
  options?: Omit<
    UseQueryOptions<{ data: PlatformAnalytics[] }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: analyticsKeys.platforms(period),
    queryFn: () =>
      apiClient.get<{ data: PlatformAnalytics[] }>(
        `/analytics/platforms${buildQuery({ period })}`,
        getToken(),
      ),
    ...options,
  });
}

// ---- Mutations ----

export function useSyncAnalytics() {
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ jobId: string }>(
        '/analytics/sync',
        {},
        getToken(),
      ),
  });
}
