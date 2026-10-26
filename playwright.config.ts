import { defineConfig, devices } from '@playwright/test'

const port = 5180
const baseURL = `http://localhost:${port}`
const ci = Boolean(process.env.CI)

export default defineConfig({
  testDir: './src/modules',
  testMatch: '**/tests/e2e/**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: ci ? '100%' : undefined,
  reporter: [[ci ? 'github' : 'list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    locale: 'en-US',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
  ],

  webServer: {
    command: `bun run dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !ci,
    env: { APP_ENV: 'development', GOOGLE_CLIENT_ID: '' },
  },
})
