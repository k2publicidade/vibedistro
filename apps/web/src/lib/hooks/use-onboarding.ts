'use client';

import {
  useMutation,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Tenant, User } from '../types';
import { getToken } from './utils';

export type ProvisioningStatus =
  | 'PENDING_LOCAL'
  | 'PROVISIONING_REVELATOR'
  | 'ACTIVE'
  | 'FAILED_RETRYABLE'
  | 'FAILED_MANUAL_REVIEW';

export interface CreateWhiteLabelOnboardingPayload {
  tenantName: string;
  tenantSlug: string;
  ownerEmail: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  password: string;
  accountType?: string;
  primaryColor?: string;
}

export interface WhiteLabelOnboardingResult {
  tenant: Pick<Tenant, 'id' | 'slug' | 'name'>;
  user: Pick<User, 'id' | 'email'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: string;
  };
  provisioningStatus: ProvisioningStatus;
}

export interface OnboardingStatusResult {
  connected: boolean;
  provisioningStatus: ProvisioningStatus;
  lastProvisioningError: string | null;
}

export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: () => [...onboardingKeys.all, 'status'] as const,
};

export function useCreateWhiteLabelOnboarding() {
  return useMutation({
    mutationFn: (payload: CreateWhiteLabelOnboardingPayload) =>
      apiClient.post<WhiteLabelOnboardingResult>(
        '/onboarding/white-label',
        payload,
      ),
  });
}

export function useOnboardingStatus(
  options?: Omit<
    UseQueryOptions<OnboardingStatusResult>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: onboardingKeys.status(),
    queryFn: () =>
      apiClient.get<OnboardingStatusResult>(
        '/onboarding/status',
        getToken(),
      ),
    ...options,
  });
}
