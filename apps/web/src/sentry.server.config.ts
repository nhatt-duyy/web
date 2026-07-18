// apps/web/src/sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  // Tỉ lệ sample traces — giảm ở production để tiết kiệm quota
  tracesSampleRate: 0.1,
  // Bắt lỗi React Server Component / API routes
  debug: false,
});
