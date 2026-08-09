import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

const GA_ID = "G-9HBTQN02YJ";
const BEACON_TIMEOUT = 15_000;

function collectCspViolations(page: Page) {
  const violations: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (/Refused to (load|connect|frame|execute)/i.test(text)) {
      violations.push(text);
    }
  });
  return violations;
}

function trackGoogleRequests(page: Page) {
  const gtagScripts: string[] = [];
  const beacons: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("googletagmanager.com/gtag/js")) {
      gtagScripts.push(url);
    } else if (/google-analytics\.com\/g\/collect/.test(url)) {
      beacons.push(url);
    }
  });
  return { gtagScripts, beacons };
}

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@wolfieroom.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function setGa4Config(page: Page, enabled: boolean, id: string) {
  const res = await page.request.put("/api/admin/settings", {
    data: { ga4Enabled: String(enabled), ga4MeasurementId: id },
  });
  expect(res.status(), `PUT settings falló: ${await res.text()}`).toBe(200);
}

test.describe.serial("Google Analytics (GA4)", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await spoofIp(page);
    await loginAdmin(page);
    await setGa4Config(page, true, GA_ID);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    // Restaura la configuración sembrada del seed (ga4MeasurementId + ga4Enabled)
    const page = await browser.newPage();
    await spoofIp(page);
    await loginAdmin(page);
    await setGa4Config(page, true, GA_ID);
    await page.close();
  });

  test("el tag de Google se carga y envía page_view sin violar la CSP", async ({ page }) => {
    const violations = collectCspViolations(page);
    const { gtagScripts, beacons } = trackGoogleRequests(page);

    await page.goto("/");

    // el script de gtag.js se carga con el measurement ID correcto
    await expect
      .poll(() => gtagScripts.some((u) => u.includes(`id=${GA_ID}`)), {
        timeout: BEACON_TIMEOUT,
      })
      .toBe(true);

    // gtag config dispara page_view: el beacon llega con tid y en=page_view
    await expect
      .poll(
        () =>
          beacons.some(
            (u) => u.includes(`tid=${GA_ID}`) && u.includes("en=page_view")
          ),
        { timeout: BEACON_TIMEOUT }
      )
      .toBe(true);

    expect(violations).toEqual([]);
  });

  test("la navegación dentro del sitio registra page_view de GA4", async ({ page }) => {
    const violations = collectCspViolations(page);
    const { beacons } = trackGoogleRequests(page);

    await page.goto("/juegos/catan");
    await expect
      .poll(() => beacons.length, { timeout: BEACON_TIMEOUT })
      .toBeGreaterThan(0);

    const before = beacons.length;
    const crumb = page
      .locator('nav[aria-label="Ruta de navegación"]')
      .getByRole("link", { name: "Inicio" });
    await expect(crumb).toBeVisible();

    await crumb.click();
    await expect(page).toHaveURL(/\/$/);

    // la navegación soft del router dispara un page_view adicional
    await expect
      .poll(() => beacons.length, { timeout: BEACON_TIMEOUT })
      .toBeGreaterThan(before);
    expect(violations).toEqual([]);
  });

  test("GA4 no se carga en el sitio público cuando no hay Measurement ID configurado", async ({ page }) => {
    await spoofIp(page);
    await loginAdmin(page);
    await setGa4Config(page, true, "");

    const { gtagScripts } = trackGoogleRequests(page);

    await page.goto("/");
    await page.waitForTimeout(1500);

    expect(gtagScripts).toEqual([]);
  });
});
