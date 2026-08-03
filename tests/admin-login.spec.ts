import { test, expect } from "@playwright/test";

test.describe("Admin login", () => {
  test("página de login carga correctamente", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Admin Panel")).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Contraseña/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Iniciar sesión/i })).toBeVisible();
  });

  test("login con credenciales inválidas muestra error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/Email/i).fill("mal@email.com");
    await page.getByLabel(/Contraseña/i).fill("wrongpass");
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();

    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10000 });
  });

  test("login exitoso redirige al dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/Email/i).fill("admin@wolfieroom.com");
    await page.getByLabel(/Contraseña/i).fill("admin123");
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("acceso a ruta protegida sin sesión redirige a login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
