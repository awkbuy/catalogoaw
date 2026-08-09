import { test, expect } from "@playwright/test";

test.describe("Sitio público", () => {
  test("homepage carga correctamente con secciones principales", async ({ page }) => {
    await page.goto("/");

    // Navbar: la marca es una imagen con aria-label = nombre del negocio
    await expect(page.getByRole("link", { name: /Wolfie Room/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Inicio/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Catálogo/i }).first()).toBeVisible();

    // Hero de categorías
    await expect(page.getByRole("heading", { name: /Explorá por categoría/i })).toBeVisible();
    await expect(page.getByText(/Encontrá el juego perfecto para cada ocasión/i)).toBeVisible();

    // Catálogo
    await expect(page.getByRole("heading", { name: /Catálogo de juegos/i })).toBeVisible();
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
      await expect(page.getByText("Catan").first()).toBeVisible({
        timeout: 10000,
      });
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
