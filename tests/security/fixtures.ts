/* eslint-disable react-hooks/rules-of-hooks -- fixtures de Playwright: `use` es el helper de fixture, no el hook de React */
import { test as base, request as pwRequest, expect } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";
import { ADMIN_STATE } from "./global-setup";

const PORT = process.env.SECURITY_PORT || "3100";
export const BASE_URL = `http://localhost:${PORT}`;
export const ADMIN_PASSWORD =
  process.env.SECURITY_ADMIN_PASSWORD || "securityTestPass123!";
export const ADMIN_EMAIL = "admin@wolfieroom.com";

export const test = base.extend<{
  adminApi: APIRequestContext;
  publicApi: APIRequestContext;
}>({
  adminApi: async ({}, use) => {
    const ctx = await pwRequest.newContext({
      baseURL: BASE_URL,
      storageState: ADMIN_STATE,
    });
    await use(ctx);
    await ctx.dispose();
  },
  publicApi: async ({}, use) => {
    const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect, ADMIN_STATE };

export function randomIp(): string {
  return `203.0.${Math.floor(Math.random() * 254) + 1}.${Math.floor(
    Math.random() * 254
  ) + 1}`;
}

export async function spoofIp(page: Page, ip: string): Promise<void> {
  await page.route("**/*", (route) => {
    const headers = { ...route.request().headers(), "x-forwarded-for": ip };
    route.continue({ headers });
  });
}

const LEAK_PATTERNS = [
  /at\s+\w+\.\w+\(.+:\d+:\d+\)/,
  /node_modules/,
  /PrismaClient/,
  /SQLite|sqlite/,
  /\.next[\\/]server/,
  /Internal\s+Server\s+Error/,
  /UnhandledRejection|uncaughtException/,
  /DATABASE_URL|SESSION_SECRET/,
];

export function assertNoLeak(body: string, label: string): void {
  for (const pattern of LEAK_PATTERNS) {
    expect(body, `${label}: no debe filtrar (${pattern})`).not.toMatch(pattern);
  }
}

export async function readBody(response: { text(): Promise<string> }): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
