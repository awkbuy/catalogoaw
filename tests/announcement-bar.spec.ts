import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

const ANNOUNCEMENT = "Envíos gratis desde $40.000";

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@catalogoapp.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function setSettings(page: Page, data: Record<string, string>) {
  const res = await page.request.put("/api/admin/settings", { data });
  expect(res.status(), `PUT settings falló: ${await res.text()}`).toBe(200);
}

test.describe.serial("Cintillo promocional", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await spoofIp(page);
    await loginAdmin(page);
    await setSettings(page, {
      announcementEnabled: "true",
      announcementText: ANNOUNCEMENT,
      popupEnabled: "false",
    });
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    // Restaura la config del seed (cintillo desactivado)
    const page = await browser.newPage();
    await spoofIp(page);
    await loginAdmin(page);
    await setSettings(page, { announcementEnabled: "false" });
    await page.close();
  });

  test("aparece en la home debajo del header y se oculta al hacer scroll", async ({
    page,
  }) => {
    await spoofIp(page);
    await page.goto("/");

    const bar = page.getByTestId("announcement-bar");
    await expect(bar).toBeVisible({ timeout: 15000 });
    await expect(bar).toContainText(ANNOUNCEMENT);

    // queda debajo del header fijo (arriba de la página)
    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeGreaterThan(0);
      expect(box.y).toBeLessThan(80);
    }

    // al hacer scroll el cintillo colapsa
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(bar).toBeHidden({ timeout: 5000 });

    // al volver arriba reaparece
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).toBeVisible({ timeout: 5000 });
  });

  test("aparece también en el detalle de un producto", async ({ page }) => {
    await spoofIp(page);
    await page.goto("/productos/smartwatch-deportivo");
    const bar = page.getByTestId("announcement-bar");
    await expect(bar).toBeVisible({ timeout: 15000 });
    await expect(bar).toContainText(ANNOUNCEMENT);
  });
});
