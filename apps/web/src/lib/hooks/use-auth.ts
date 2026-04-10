'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { getToken } from './utils';

// ---- Mutations ----

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<void>('/auth/logout', {}, getToken()),
    onSettled: () => {
      // Always clear local state, even on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0';
      }
      // Clear entire query cache
      qc.clear();
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });
}
