'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  Notification,
  PaginatedResponse,
  PaginationParams,
} from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: NotificationListParams) =>
    [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

// ---- Params ----

export interface NotificationListParams extends PaginationParams {
  read?: boolean;
}

// ---- Queries ----

export function useNotifications(
  params: NotificationListParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Notification>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Notification>>(
        `/notifications${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useUnreadCount(
  options?: Omit<
    UseQueryOptions<{ count: number }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () =>
      apiClient.get<{ count: number }>(
        '/notifications/unread-count',
        getToken(),
      ),
    refetchInterval: 30_000, // poll every 30s
    ...options,
  });
}

// ---- Mutations ----

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<Notification>(
        `/notifications/${id}/read`,
        {},
        getToken(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
      qc.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.patch<void>(
        '/notifications/read-all',
        {},
        getToken(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
      qc.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}
