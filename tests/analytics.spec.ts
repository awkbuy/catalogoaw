import { test, expect, type Page } from "@playwright/test";

const GA_ID = "G-9HBTQN02YJ";

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

test.describe("Google Analytics (GA4)", () => {
  test("el tag de Google se carga y envía page_view sin violar la CSP", async ({ page }) => {
    const violations = collectCspViolations(page);
    const { gtagScripts, beacons } = trackGoogleRequests(page);

    await page.goto("/");

    // el script de gtag.js se carga con el measurement ID correcto
    await expect
      .poll(() => gtagScripts.some((u) => u.includes(`id=${GA_ID}`)))
      .toBe(true);

    // gtag config dispara page_view: el beacon llega con tid y en=page_view
    await expect
      .poll(() =>
        beacons.some(
          (u) => u.includes(`tid=${GA_ID}`) && u.includes("en=page_view")
        )
      )
      .toBe(true);

    expect(violations).toEqual([]);
  });

  test("la navegación dentro del sitio registra page_view de GA4", async ({ page }) => {
    const violations = collectCspViolations(page);
    const { beacons } = trackGoogleRequests(page);

    await page.goto("/juegos/catan");
    await expect.poll(() => beacons.length).toBeGreaterThan(0);

    const before = beacons.length;
    const crumb = page
      .locator('nav[aria-label="Ruta de navegación"]')
      .getByRole("link", { name: "Inicio" });
    await expect(crumb).toBeVisible();

    await crumb.click();
    await expect(page).toHaveURL(/\/$/);

    // la navegación soft del router dispara un page_view adicional
    await expect.poll(() => beacons.length).toBeGreaterThan(before);
    expect(violations).toEqual([]);
  });
});
