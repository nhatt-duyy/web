// apps/web/src/lib/api-client.ts
'use client';
import { useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useApi() {
  const { data: session } = useSession();
  // Bọc bằng useCallback để hàm trả về ổn định (chỉ đổi khi session đổi).
  // Tránh useEffect phụ thuộc vào hàm này re-run vô hạn (lỗi fetch loop ở checkout/return).
  return useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = (session as any)?.accessToken;
      return fetch(`/api${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
    },
    [session],
  );
}