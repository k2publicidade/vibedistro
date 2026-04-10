import type { Timestamps, ID } from '../common';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'INVITED';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface UserProfile {
  id: ID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  onboardingStatus: OnboardingStatus;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
}

export interface UserWithRole extends UserProfile, Timestamps {
  roleId: string;
  roleName: string;
  roleSlug: string;
  isOwner: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface SessionUser {
  id: ID;
  email: string;
  tenantId: ID;
  roleSlug: string;
  permissions: string[]; // "resource:action:scope"
}

export interface LoginDto {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  inviteToken?: string;
}

export interface CreateUserDto {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
}

export interface InviteUserDto {
  email: string;
  roleId: string;
  tenantId: string;
}
