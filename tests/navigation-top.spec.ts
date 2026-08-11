import { test, expect } from "@playwright/test";

test.describe("Navegación al inicio de la página", () => {
  test("el botón flotante Volver arriba ya no existe", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
    );
    await expect(page.getByRole("button", { name: "Volver arriba" })).toHaveCount(0);
  });

  test("el botón Inicio del menú vuelve al tope de la página", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
    );
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "Inicio" }).first().click();

    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(10);
  });
});
