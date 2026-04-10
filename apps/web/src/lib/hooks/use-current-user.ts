'use client';

import { useSyncExternalStore } from 'react';

export interface CurrentUser {
  id: string;
  email: string;
  tenantId: string;
  roleSlug: string;
  permissions: string[];
}

function getSnapshot(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

function getServerSnapshot(): CurrentUser | null {
  return null;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function useCurrentUser(): CurrentUser | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
