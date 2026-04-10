// In browser: use relative URL (goes through Next.js rewrite proxy → avoids CORS)
// In SSR: use full API URL
const API_BASE =
  typeof window === 'undefined'
    ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`
    : '/api/v1';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token refresh logic — prevents multiple concurrent refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Refresh failed — clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
      window.location.href = '/login';
      return null;
    }

    const data = await res.json();
    const newToken = data.accessToken;
    localStorage.setItem('token', newToken);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    document.cookie = `token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    return newToken;
  } catch {
    return null;
  }
}

async function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(
  path: string,
  options?: RequestInit & { token?: string; _retried?: boolean },
): Promise<T> {
  const { token, _retried, ...init } = options ?? {};

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // On 401: try refresh token once, then retry
  if (res.status === 401 && !_retried && typeof window !== 'undefined') {
    const newToken = await getRefreshedToken();
    if (newToken) {
      return request<T>(path, { ...options, token: newToken, _retried: true });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? `HTTP ${res.status}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
};

export { ApiError };
