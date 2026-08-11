import { test, expect } from "@playwright/test";

test.describe("Conversión — buy box y panel de compra (Fase 1)", () => {
  test("la ficha muestra el buy box con Comprar, Agregar, condición y medios de pago", async ({
    page,
  }) => {
    await page.goto("/juegos/catan");

    const buyBox = page.getByRole("complementary");
    await expect(buyBox.getByText(/Nuevo · Vendido por/)).toBeVisible();
    await expect(buyBox.getByRole("button", { name: "Comprar" })).toBeVisible();
    await expect(buyBox.getByRole("button", { name: /Agregar al carrito/ })).toBeVisible();
    await expect(buyBox.getByText("Medios de pago:")).toBeVisible();
  });

  test("Comprar agrega al carrito y abre el checkout", async ({ page }) => {
    await page.goto("/juegos/catan");

    await page.getByRole("button", { name: "Comprar" }).click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("Agregar al carrito no abre el checkout y el ítem queda guardado", async ({ page }) => {
    await page.goto("/juegos/catan");

    await page.getByRole("button", { name: /Agregar al carrito/ }).click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toHaveCount(0);

    await page.getByLabel("Abrir carrito").first().click();
    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("el modal muestra Compartir y Agregar en dos columnas", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Ver detalle" }).first().click();

    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Agregar al carrito/ })).toBeVisible();
    await expect(page.getByText("Observaciones")).toBeVisible();
  });

  test("el modal mantiene Compartir y Agregar fijos abajo al scrollear el contenido", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Ver detalle" }).first().click();

    const contenido = page.locator("div.flex-1.overflow-y-auto");
    await contenido.evaluate((el) => (el.scrollTop = el.scrollHeight));

    await expect(page.getByRole("button", { name: "Compartir" })).toBeInViewport();
    await expect(page.getByRole("button", { name: /Agregar al carrito/ })).toBeInViewport();
  });

  test("modal: Agregar al carrito cierra el modal, no abre el checkout y muestra Ver carrito", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Ver detalle" }).first().click();
    await page.getByRole("button", { name: /Agregar al carrito/ }).click();

    await expect(page.getByRole("heading", { name: "Detalle del producto" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Carrito" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Ver carrito/ })).toBeVisible();

    await page.getByRole("button", { name: /Ver carrito/ }).click();
    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("el carrito mantiene Subtotal y Pedir por WhatsApp fijos abajo al scrollear", async ({
    page,
  }) => {
    await page.goto("/juegos/catan");

    await page.getByRole("button", { name: "Comprar" }).click();
    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();

    const contenido = page.locator("div.flex-1.overflow-y-auto");
    await contenido.evaluate((el) => (el.scrollTop = el.scrollHeight));

    await expect(page.getByText("Subtotal")).toBeInViewport();
    await expect(page.getByRole("button", { name: /Pedir por WhatsApp/ })).toBeInViewport();
  });

  test("la card muestra Comprar y al clickearlo agrega y abre el carrito", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Comprar" }).first().click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("móvil: la barra sticky agrega con Agregar y abre el carrito con Comprar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/juegos/catan");

    await page.evaluate(() => window.scrollBy(0, 1200));

    const stickyAgregar = page.getByRole("button", { name: "Agregar" }).first();
    await expect(stickyAgregar).toBeInViewport();
    await stickyAgregar.click();

    await expect(page.getByRole("button", { name: /Ver carrito/ })).toBeVisible();

    const stickyComprar = page.getByRole("button", { name: "Comprar" }).last();
    await stickyComprar.click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(2 productos)")).toBeVisible();
  });

  test("móvil: buy box arriba del pliegue y barra sticky al scrollear", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/juegos/catan");

    const buyBox = page.getByRole("button", { name: "Comprar" }).first();
    await expect(buyBox).toBeInViewport();

    await page.evaluate(() => window.scrollBy(0, 1200));

    const stickyBar = page.getByRole("button", { name: "Comprar" }).last();
    await expect(stickyBar).toBeInViewport();
  });
});
