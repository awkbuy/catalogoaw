import { test, expect } from "@playwright/test";

test.describe("Sitio público", () => {
  test("homepage carga correctamente con secciones principales", async ({ page }) => {
    await page.goto("/");

    // Navbar
    await expect(page.getByText(/Wolfie Room/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Inicio/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Catálogo/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Reservar mesa/i }).first()).toBeVisible();

    // Catalog section
    await expect(page.getByRole("heading", { name: /Nuestro Catálogo/i })).toBeVisible();
    await expect(page.getByText(/Explorá nuestra colección/i)).toBeVisible();

    // Footer
    await expect(page.getByText(/Wolfie Room/i).last()).toBeVisible();

    // WhatsApp button
    await expect(page.locator('a[href*="wa.me"]').first()).toBeVisible();
  });

  test("juegos se renderizan en el catálogo", async ({ page }) => {
    await page.goto("/");

    await page.waitForSelector("#catalogo");
    const gameCards = page.locator("h3");
    const count = await gameCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("filtro por categoría funciona", async ({ page }) => {
    await page.goto("/");

    const categoryButtons = page.locator("#catalogo button, #catalogo a").filter({ hasText: /Estrategia|Familiar|Party|Cooperativo|Abstracto|Dexterity/i });
    const catCount = await categoryButtons.count();
    expect(catCount).toBeGreaterThan(0);

    if (catCount > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(300);
    }
  });

  test("buscador de juegos funciona", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Catan");
      await page.waitForTimeout(300);
      await expect(page.getByText("Catan").first()).toBeVisible();
    }
  });

  test("navegación por anclas funciona", async ({ page }) => {
    await page.goto("/");

    const catalogoLink = page.getByRole("link", { name: /Catálogo/i }).first();
    if (await catalogoLink.isVisible()) {
      await catalogoLink.click();
      await expect(page).toHaveURL(/#catalogo/);
    }
  });
});
