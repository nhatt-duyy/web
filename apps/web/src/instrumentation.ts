// apps/web/src/instrumentation.ts
// Next.js instrumentation hook — chạy sớm nhất ở cả server & edge runtime.
// Tích hợp Sentry. Chỉ init nếu có NEXT_PUBLIC_SENTRY_DSN (tránh lỗi build CI thiếu DSN).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    await import('./sentry.edge.config');
  }
}
