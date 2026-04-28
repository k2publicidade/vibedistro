export const REVELATOR_PROVIDER = 'revelator';

export const REVELATOR_ENTITY_TYPES = {
  tenant: 'tenant',
  user: 'user',
} as const;

export const PROVISIONING_STATUS = {
  pendingLocal: 'PENDING_LOCAL',
  provisioningRevelator: 'PROVISIONING_REVELATOR',
  active: 'ACTIVE',
  failedRetryable: 'FAILED_RETRYABLE',
  failedManualReview: 'FAILED_MANUAL_REVIEW',
} as const;

export type ProvisioningStatus =
  (typeof PROVISIONING_STATUS)[keyof typeof PROVISIONING_STATUS];
