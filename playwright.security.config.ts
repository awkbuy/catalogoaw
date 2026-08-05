import { defineConfig, devices } from "@playwright/test";
import path from "path";

const PORT = process.env.SECURITY_PORT || "3100";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/security",
  // Secuencial: los tests de ataque dependen de orden (rate limits, limpieza).
  fullyParallel: false,
  workers: process.env.CI ? 1 : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/security-report.json" }],
  ],
  globalSetup: "./tests/security/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "security-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node scripts/security-server.mjs",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      SECURITY_PORT: PORT,
    },
  },
});
