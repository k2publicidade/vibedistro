'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  User,
  Invite,
  PaginatedResponse,
  PaginationParams,
} from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  invites: () => [...userKeys.all, 'invites'] as const,
};

// ---- Params ----

export interface UserListParams extends PaginationParams {}

// ---- Queries ----

export function useUsers(
  params: UserListParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<User>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<User>>(
        `/users${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useUser(
  id: string,
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => apiClient.get<User>(`/users/${id}`, getToken()),
    enabled: !!id,
    ...options,
  });
}

export function useInvites(
  options?: Omit<UseQueryOptions<Invite[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: userKeys.invites(),
    queryFn: () =>
      apiClient.get<Invite[]>('/users/invites', getToken()),
    ...options,
  });
}

// ---- Mutations ----

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; roleId: string }) =>
      apiClient.post<Invite>('/users/invite', body, getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.invites() });
    },
  });
}

export function useCancelInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/users/invites/${id}`, getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.invites() });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
      apiClient.patch<User>(`/users/${id}/role`, { roleId }, getToken()),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      qc.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
}
