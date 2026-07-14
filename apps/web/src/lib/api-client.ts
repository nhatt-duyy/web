// apps/web/src/lib/api-client.ts
'use client';
import { useSession } from 'next-auth/react';

export function useApi() {
  const { data: session } = useSession();
  return async (path: string, init: RequestInit = {}) => {
    const token = (session as any)?.accessToken;
    return fetch(`/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  };
}