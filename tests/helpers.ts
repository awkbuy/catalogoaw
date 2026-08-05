import type { Page } from "@playwright/test";

export function randomIp(): string {
  return `198.51.${Math.floor(Math.random() * 254) + 1}.${Math.floor(
    Math.random() * 254
  ) + 1}`;
}

/**
 * Aísla el bucket de rate limit del login: cada test usa una IP distinta.
 * Sin esto, todos los intentos desde localhost comparten la IP "unknown"
 * y el rate limit (5/min) bloquea la batería completa.
 */
export async function spoofIp(page: Page): Promise<void> {
  const ip = randomIp();
  await page.route("**/*", (route) => {
    const headers = { ...route.request().headers(), "x-forwarded-for": ip };
    route.continue({ headers });
  });
}
