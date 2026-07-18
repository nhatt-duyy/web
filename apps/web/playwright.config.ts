import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config (Phase 6 — Workstream B).
 * Boot web dev server (Next.js) rồi chạy kịch bản trên port 3000.
 * Backend API phải chạy riêng (docker-compose) hoặc NEXT_PUBLIC_API_URL trỏ đúng.
 */
const PORT = 3000;
const baseURL = process.env.WEB_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'e2e-dummy-secret',
      NEXTAUTH_URL: baseURL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://test:test@localhost:5432/sourceban_test?schema=public',
    },
  },
});
