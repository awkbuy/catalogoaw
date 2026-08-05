import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const PORT = process.env.SECURITY_PORT || "3100";
const BASE_URL = `http://localhost:${PORT}`;
const ADMIN_PASSWORD = process.env.SECURITY_ADMIN_PASSWORD || "securityTestPass123!";

export const ADMIN_STATE = path.resolve(
  __dirname,
  "../../.security-state/admin.json"
);

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(ADMIN_STATE), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // IP fija para el login del admin (aisla el bucket de rate limit).
  await page.route("**/*", (route) => {
    const headers = {
      ...route.request().headers(),
      "x-forwarded-for": "10.0.0.99",
    };
    route.continue({ headers });
  });

  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/Email/i).fill("admin@wolfieroom.com");
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

  await context.storageState({ path: ADMIN_STATE });
  await browser.close();
}
