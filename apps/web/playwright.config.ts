import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  retries: process.env.CI ? 2 : 0,
  // The dev-mode servers (tsx watch + Vite dev) aren't built for heavy concurrency —
  // running with the default (CPU-core-count) workers overwhelms them and produces
  // cascading login timeouts. Cap concurrency for local runs against dev servers.
  workers: process.env.CI ? undefined : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-pixel7',    use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npx pnpm@9.15.4 --filter @visaiq/backend dev',
      url: 'http://127.0.0.1:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        PORT: '3001',
        JWT_SECRET: 'playwright-test-secret-do-not-use-in-production',
        CORS_ORIGINS: 'http://localhost:5174,http://127.0.0.1:5174',
        AI_MOCK: 'true',
        RATE_LIMIT_DISABLED: 'true',
        FIRESTORE_DISABLED: 'true',
        ENABLE_DEMO_LOGIN: 'true',
      },
    },
    {
      command: 'npx pnpm@9.15.4 --filter @visaiq/web dev',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_API_BASE_URL: 'http://localhost:3001',
      },
    },
  ],
});
