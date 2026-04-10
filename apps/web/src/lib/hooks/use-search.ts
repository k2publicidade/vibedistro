'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { GlobalSearchResult } from '../types';
import { getToken } from './utils';

// ---- Keys ----

export const searchKeys = {
  all: ['search'] as const,
  global: (query: string) => [...searchKeys.all, 'global', query] as const,
};

// ---- Queries ----

export function useGlobalSearch(
  query: string,
  options?: Omit<
    UseQueryOptions<GlobalSearchResult>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: searchKeys.global(query),
    queryFn: () =>
      apiClient.get<GlobalSearchResult>(
        `/search?q=${encodeURIComponent(query)}`,
        getToken(),
      ),
    enabled: query.length >= 2,
    placeholderData: (prev) => prev, // keep previous data while fetching
    staleTime: 10_000, // cache search results briefly
    ...options,
  });
}
