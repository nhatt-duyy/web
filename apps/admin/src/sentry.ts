// apps/admin/src/sentry.ts
// Khởi tạo Sentry cho Admin SPA. Chỉ init nếu có import.meta.env.VITE_SENTRY_DSN.
// DSN lấy từ biến build-time (Vite), KHÔNG hardcode secret.
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE ?? 'development',
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
}
