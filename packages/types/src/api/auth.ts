import type { AuthTokens, SessionUser } from '../domain/user';

export interface LoginResponse {
  user: SessionUser;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}
