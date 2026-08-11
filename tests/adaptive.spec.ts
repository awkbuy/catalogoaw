import { test, expect, type Page } from "@playwright/test";

async function getProfile(page: Page) {
  await page.waitForFunction(
    () => localStorage.getItem("adaptive-profile") !== null
  );
  return page.evaluate(() => {
    const raw = localStorage.getItem("adaptive-profile");
    return raw ? JSON.parse(raw).profile : null;
  });
}

test.describe("Rendimiento adaptativo", () => {
  test("reduced-motion fuerza perfil lite y el contenido sigue visible", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Catálogo de juegos/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Explorá por categoría/i })
    ).toBeVisible();

    expect(await getProfile(page)).toBe("lite");

    const cards = page.locator("#catalogo h3");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("perfil lite mantiene el flujo de carrito funcional", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await page.waitForSelector("#catalogo");
    await expect(page.locator("#catalogo h3").first()).toBeVisible();

    const firstName = (await page.locator("#catalogo h3").first().textContent())?.trim();
    expect(firstName).toBeTruthy();

    const quickAdd = page.locator("#catalogo").getByRole("button", { name: "Comprar" }).first();
    // El click de "Comprar" puede perderse si React aún no hidrató
    // el handler. Se reintenta hasta que el badge del carrito refleje el item.
    await expect(async () => {
      await quickAdd.click();
      await expect(
        page.getByRole("button", { name: "Abrir carrito" }).first()
      ).toContainText("1");
    }).toPass({ timeout: 10_000 });

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.locator("h4").filter({ hasText: firstName! })).toBeVisible();

    expect(await getProfile(page)).toBe("lite");
  });

  test("hardware potente sin reduced-motion obtiene perfil premium", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "no-preference" });
    await context.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
        get: () => 8,
        configurable: true,
      });
      Object.defineProperty(Navigator.prototype, "deviceMemory", {
        get: () => 8,
        configurable: true,
      });
    });

    const page = await context.newPage();
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Catálogo de juegos/i })
    ).toBeVisible();
    expect(await getProfile(page)).toBe("premium");

    await context.close();
  });
});
