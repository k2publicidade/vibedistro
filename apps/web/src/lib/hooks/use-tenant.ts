'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { getToken } from './utils';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxArtists: number;
  maxReleases: number;
  maxStorageGb: number;
  platformFeePercent: number;
  defaultLanguage: string;
  defaultTerritory: string;
  apiKey: string | null;
  webhookUrl: string | null;
  branding?: {
    primaryColor: string;
    logoUrl: string | null;
  } | null;
}

export const tenantKeys = {
  current: ['tenant', 'current'] as const,
};

export function useCurrentTenant(
  options?: Omit<UseQueryOptions<Tenant>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tenantKeys.current,
    queryFn: () => apiClient.get<Tenant>('/tenants/current', getToken()),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export interface UpdateTenantBody {
  name?: string;
  platformFeePercent?: number;
  defaultLanguage?: string;
  defaultTerritory?: string;
  webhookUrl?: string;
}

export function useUpdateCurrentTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateTenantBody & { id: string }) => {
      const { id, ...data } = body;
      return apiClient.patch<Tenant>(`/tenants/${id}`, data, getToken());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.current });
    },
  });
}
