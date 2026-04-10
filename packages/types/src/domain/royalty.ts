import type { Timestamps, ID } from '../common';

export type RoyaltyStatementStatus = 'DRAFT' | 'PROCESSING' | 'AVAILABLE' | 'DISPUTED' | 'FINAL';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REVERSED';

export interface RoyaltyStatement extends Timestamps {
  id: ID;
  tenantId: ID;
  period: string;
  status: RoyaltyStatementStatus;
  totalRevenueCents: string;
  currency: string;
  processedAt: string | null;
  finalizedAt: string | null;
}

export interface RoyaltyEntry {
  id: ID;
  statementId: ID;
  walletId: ID;
  trackIsrc: string | null;
  releaseUpc: string | null;
  dspName: string | null;
  territory: string | null;
  period: string;
  streams: string;
  grossRevenueCents: string;
  netRevenueCents: string;
  platformFeeCents: string;
  currency: string;
  createdAt: string;
}

export interface Wallet {
  id: ID;
  tenantId: ID;
  artistId: ID | null;
  userId: ID | null;
  balanceCents: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRequest extends Timestamps {
  id: ID;
  tenantId: ID;
  walletId: ID;
  requestedBy: ID;
  amountCents: string;
  currency: string;
  status: PayoutStatus;
  paymentMethod: string | null;
  paymentReference: string | null;
  processedAt: string | null;
  failureReason: string | null;
}

export interface CreatePayoutRequestDto {
  walletId: string;
  amountCents: number;
  currency?: string;
  paymentMethod: string;
  paymentDetails?: Record<string, unknown>;
}
