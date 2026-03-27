import type { AuditFields, ID } from '../common.js';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CHURNED' | 'SETUP';
export type TenantPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' | 'WHITE_LABEL';

export interface TenantBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  customDomain: string | null;
  supportEmail: string | null;
}

export interface Tenant extends AuditFields {
  id: ID;
  slug: string;
  name: string;
  status: TenantStatus;
  plan: TenantPlan;
  maxArtists: number;
  maxReleases: number;
  maxStorageGb: number;
  platformFeePercent: string;
  branding: TenantBranding | null;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan?: TenantPlan;
  ownerId?: string;
  branding?: Partial<TenantBranding>;
}

export interface UpdateTenantDto {
  name?: string;
  plan?: TenantPlan;
  maxArtists?: number;
  maxReleases?: number;
  maxStorageGb?: number;
  platformFeePercent?: string;
  branding?: Partial<TenantBranding>;
}
