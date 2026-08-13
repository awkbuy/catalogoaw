import { test, expect } from "@playwright/test";

test.describe("Compartir en detalle de producto", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("el botón Compartir copia el enlace completo del producto", async ({
    page,
  }) => {
    await page.goto("/productos/smartwatch-deportivo");

    await page.getByRole("button", { name: "Compartir" }).click();

    await expect(page.getByText("Enlace copiado")).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe("http://localhost:3000/productos/smartwatch-deportivo");
  });

  test("el enlace copiado corresponde al producto abierto", async ({ page }) => {
    await page.goto("/productos/smartwatch-deportivo");

    await page.getByRole("button", { name: "Compartir" }).click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe("http://localhost:3000/productos/smartwatch-deportivo");
  });
});
