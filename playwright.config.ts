import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      ENABLE_MOCK_RIOT: "true",
      DEMO_AUTO_LOGIN: "true",
      APP_SESSION_SECRET: "playwright-demo-secret",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
