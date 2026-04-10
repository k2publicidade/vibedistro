import axios from 'axios';

import type { RevelatorConfig } from './config';

interface LoginPartnerResponse {
  accessToken: string;
  isAuthorized: boolean;
  permissions: Array<{
    enterpriseId: number;
    enterpriseName: string;
    isOwner: boolean;
    isActive: boolean;
  }>;
}

/**
 * Manages authentication against the Revelator API.
 *
 * Auth flow:
 *   POST /account/loginpartner { partnerApiKey, partnerUserId }
 *   → { accessToken: "<uuid>", permissions: [...] }
 *
 * The accessToken is a UUID string used as: Authorization: Bearer <token>
 * Revelator does not expose token TTL; we re-login every 4 hours as a safe default.
 */
export class RevelatorAuthClient {
  private accessToken: string | null = null;
  private enterpriseId: number | null = null;
  private lastRefreshedAt: number = 0;

  /** Conservative refresh interval — Revelator doesn't document TTL */
  private readonly tokenTtlMs = 4 * 60 * 60 * 1000;

  constructor(private readonly config: RevelatorConfig) {}

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    const isExpired = now - this.lastRefreshedAt > this.tokenTtlMs;

    if (!this.accessToken || isExpired) {
      await this.login();
    }

    return this.accessToken!;
  }

  /** Enterprise ID resolved at login time from the permissions array. */
  async getEnterpriseId(): Promise<number> {
    if (!this.enterpriseId) {
      await this.login();
    }
    return this.enterpriseId!;
  }

  /** Force token refresh — called by the provider on 401 responses. */
  async refresh(): Promise<void> {
    this.accessToken = null;
    await this.login();
  }

  private async login(): Promise<void> {
    const url = `${this.config.baseUrl}/account/loginpartner`;

    const response = await axios.post<LoginPartnerResponse>(
      url,
      {
        partnerApiKey: this.config.partnerApiKey,
        partnerUserId: this.config.partnerUserId,
      },
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        timeout: this.config.timeoutMs,
      },
    );

    const { accessToken, isAuthorized, permissions } = response.data;

    if (!isAuthorized || !accessToken) {
      throw new Error('[RevelatorAuth] Login failed: isAuthorized=false or missing accessToken');
    }

    this.accessToken = accessToken;
    this.lastRefreshedAt = Date.now();

    // Prefer explicit config override, otherwise take first active permission
    if (this.config.enterpriseId > 0) {
      this.enterpriseId = this.config.enterpriseId;
    } else {
      const active = permissions.find((p) => p.isActive && p.isOwner) ?? permissions[0];
      if (!active) {
        throw new Error('[RevelatorAuth] No enterprise found in permissions after login');
      }
      this.enterpriseId = active.enterpriseId;
    }

    console.log(
      `[RevelatorAuth] Authenticated — enterpriseId=${this.enterpriseId} env=${this.config.environment}`,
    );
  }
}
