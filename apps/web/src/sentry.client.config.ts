// apps/web/src/sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0.1,
  // Bắt lỗi runtime phía client (React error boundary)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
});
