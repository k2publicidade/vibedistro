import axios from 'axios';
import type { RevelatorConfig } from './config.js';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

/**
 * Handles OAuth2 client_credentials flow for Revelator.
 * Caches the token in memory and refreshes 60s before expiry.
 */
export class RevelatorAuthClient {
  private cached: CachedToken | null = null;

  constructor(private readonly config: RevelatorConfig) {}

  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.cached!.accessToken;
    }
    return this.fetchNewToken();
  }

  private isTokenValid(): boolean {
    if (!this.cached) return false;
    // Refresh 60s early to avoid race conditions
    return Date.now() < this.cached.expiresAt - 60_000;
  }

  private async fetchNewToken(): Promise<string> {
    const response = await axios.post<TokenResponse>(
      `${this.config.baseUrl}/auth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: this.config.timeoutMs,
      },
    );

    const data = response.data;
    this.cached = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1_000,
    };

    return this.cached.accessToken;
  }

  invalidate(): void {
    this.cached = null;
  }
}
