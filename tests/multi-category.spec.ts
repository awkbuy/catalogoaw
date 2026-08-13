import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@catalogoapp.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function getCategoriaIdByName(page: Page, nombre: string): Promise<string> {
  const res = await page.request.get("/api/admin/categorias");
  expect(res.status()).toBe(200);
  const cats: { id: string; nombre: string }[] = await res.json();
  const cat = cats.find((c) => c.nombre === nombre);
  expect(cat, `La categoría "${nombre}" debería existir en el seed`).toBeTruthy();
  return cat!.id;
}

test.describe("Multi-categoría", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
    await loginAdmin(page);
  });

  test("un producto pertenece a varias categorías y aparece en el catálogo bajo cada una", async ({ page }) => {
    const suffix = Date.now();
    const nombre = `Test Multi Cat ${suffix}`;
    const slug = `test-multi-cat-${suffix}`;

    const estrategiaId = await getCategoriaIdByName(page, "Tecnología");
    const partyId = await getCategoriaIdByName(page, "Moda");

    const createRes = await page.request.post("/api/admin/productos", {
      data: {
        nombre,
        slug,
        descripcion: "Producto creado para testear las categorías múltiples.",
        categoriaId: estrategiaId,
        categoriaIds: [estrategiaId, partyId],
        jugadoresMin: 2,
        jugadoresMax: 4,
        duracion: "30 min",
        edad: "8+",
        dificultad: "Fácil",
        precioFinalVenta: "$10.000",
        estado: "Disponible",
        destacado: false,
        nuevo: true,
        disponibleVenta: true,
        disponibleMesa: true,
        orden: 999,
      },
    });
    expect(createRes.status(), `Fallo al crear: ${await createRes.text()}`).toBe(200);
    const created = await createRes.json();

    try {
      const listRes = await page.request.get("/api/admin/productos");
      const productos: {
        id: string;
        categorias?: { nombre: string }[];
      }[] = await listRes.json();
      const producto = productos.find((j) => j.id === created.id);
      expect(producto).toBeTruthy();
      const catNames = (producto?.categorias ?? []).map((c) => c.nombre);
      expect(catNames).toContain("Tecnología");
      expect(catNames).toContain("Moda");

      await page.goto("/");
      await page.waitForSelector("#catalogo");

      await page
        .locator('#catalogo input[placeholder*="Buscar"]')
        .first()
        .fill(nombre);
      await expect(page.getByRole("heading", { name: nombre })).toBeVisible();

      await page
        .locator("#catalogo")
        .getByRole("button", { name: /Moda/ })
        .click();
      await expect(page.getByRole("heading", { name: nombre })).toBeVisible();

      await page
        .locator("#catalogo")
        .getByRole("button", { name: /Tecnología/ })
        .click();
      await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
    } finally {
      await page.request.delete(`/api/admin/productos/${created.id}`);
    }
  });

  test("regresión: guardar settings devuelve 200 al incluir horarios_semana", async ({ page }) => {
    const getRes = await page.request.get("/api/admin/settings");
    expect(getRes.status()).toBe(200);
    const settings: Record<string, string> = await getRes.json();
    expect(settings.horarios_semana).toBeDefined();

    const putRes = await page.request.put("/api/admin/settings", {
      data: settings,
    });
    expect(putRes.status(), `PUT settings falló: ${await putRes.text()}`).toBe(200);
  });

  test("regresión: guardar settings devuelve 200 al incluir clave histórica logo", async ({ page }) => {
    const getRes = await page.request.get("/api/admin/settings");
    expect(getRes.status()).toBe(200);
    const settings: Record<string, string> = await getRes.json();

    const putRes = await page.request.put("/api/admin/settings", {
      data: { ...settings, logo: "" },
    });
    expect(putRes.status(), `PUT settings falló: ${await putRes.text()}`).toBe(200);
  });
});
