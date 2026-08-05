import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // La suite de seguridad vive en tests/security y corre con su propia config
  // (playwright.security.config.ts) y su propio servidor/BD aislados.
  testIgnore: "tests/security/**",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
