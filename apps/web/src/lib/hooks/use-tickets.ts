'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  PaginatedResponse,
  PaginationParams,
} from '../types';
import { getToken, buildQuery } from './utils';

// ---- Keys ----

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (params: TicketListParams) =>
    [...ticketKeys.lists(), params] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};

// ---- Params ----

export interface TicketListParams extends PaginationParams {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export interface CreateTicketBody {
  subject: string;
  priority: TicketPriority;
  category?: string;
  description: string;
}

export interface UpdateTicketBody {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
}

// ---- Queries ----

export function useTickets(
  params: TicketListParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Ticket>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Ticket>>(
        `/tickets${buildQuery(params)}`,
        getToken(),
      ),
    ...options,
  });
}

export function useTicket(
  id: string,
  options?: Omit<UseQueryOptions<Ticket>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => apiClient.get<Ticket>(`/tickets/${id}`, getToken()),
    enabled: !!id,
    ...options,
  });
}

// ---- Mutations ----

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTicketBody) =>
      apiClient.post<Ticket>('/tickets', body, getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateTicketBody & { id: string }) =>
      apiClient.patch<Ticket>(`/tickets/${id}`, body, getToken()),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
    },
  });
}

export function useAddTicketMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      body,
    }: {
      ticketId: string;
      body: string;
    }) =>
      apiClient.post<TicketMessage>(
        `/tickets/${ticketId}/messages`,
        { body },
        getToken(),
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ticketKeys.detail(variables.ticketId),
      });
    },
  });
}
