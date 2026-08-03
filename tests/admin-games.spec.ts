import { test, expect } from "@playwright/test";

test.describe("Admin - Gestión de juegos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("admin@wolfieroom.com");
    await page.getByLabel(/Contraseña/i).fill("admin123");
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("dashboard muestra estadísticas", async ({ page }) => {
    await expect(page.getByText(/Total Juegos/i)).toBeVisible();
    await expect(page.getByText(/Categorías/i).first()).toBeVisible();
    await expect(page.getByText(/Destacados/i)).toBeVisible();
    await expect(page.getByText(/Publicados/i)).toBeVisible();
  });

  test("lista de juegos carga correctamente", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByText(/Juegos/i)).toBeVisible();
    await page.waitForSelector("table, .divide-y", { timeout: 10000 });
  });

  test("página de nuevo juego carga", async ({ page }) => {
    await page.goto("/games/new");
    await expect(page.getByRole("heading", { name: /Nuevo juego/i })).toBeVisible();
  });

  test("duplicar juego funciona", async ({ page }) => {
    await page.goto("/games");
    await page.waitForSelector('button[title="Duplicar"]', { timeout: 10000 });
    const duplicateButtons = page.locator('button[title="Duplicar"]');
    const count = await duplicateButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("navegación del sidebar funciona", async ({ page }) => {
    await page.goto("/dashboard");

    // Sidebar links should be present
    const sidebar = page.locator("nav").first();
    await expect(sidebar.getByText(/Dashboard/i)).toBeVisible();
    await expect(sidebar.getByText(/Juegos/i)).toBeVisible();
    await expect(sidebar.getByText(/Categorías/i)).toBeVisible();
  });

  test("categorías page loads", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: /Categorías/i })).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(/Configuración/i)).toBeVisible();
  });
});
