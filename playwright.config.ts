import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config — roda contra staging por padrão.
 * Para rodar local: BASE_URL=http://localhost:3000 npx playwright test
 */
const BASE_URL = process.env.BASE_URL ?? 'https://staging.hallyuhub.com.br'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 6 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 20_000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
