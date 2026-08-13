import { test, expect } from "@playwright/test";
import { spoofIp } from "./helpers";

test.describe("Marketing - campos por producto", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("admin@catalogoapp.com");
    await page.locator('input[name="password"]').fill("admin123");
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("sección Marketing visible en el formulario de nuevo producto", async ({ page }) => {
    await page.goto("/productos/new");
    await expect(page.getByRole("heading", { name: "Marketing" })).toBeVisible();
    await expect(page.getByLabel(/Mostrar en Google Merchant/i)).toBeVisible();
    await expect(page.getByLabel(/Mostrar en Meta Commerce/i)).toBeVisible();
    await expect(page.getByLabel(/Permitir anuncios dinámicos/i)).toBeVisible();
    await expect(page.getByLabel(/Incluir en remarketing/i)).toBeVisible();
    await expect(page.locator('input[name="gtin"]')).toBeVisible();
    await expect(page.locator('select[name="condition"]')).toBeVisible();
    await expect(page.locator('input[name="marketingPriority"]')).toBeVisible();
  });

  test("crear y editar un producto persisten los campos de marketing", async ({ page }) => {
    const productos = await (await page.request.get("/api/admin/productos")).json();
    const categoriaId = productos[0].categoriaId;
    const slug = `marketing-test-${Date.now()}`;

    const createRes = await page.request.post("/api/admin/productos", {
      data: {
        nombre: "Producto Marketing Test",
        slug,
        descripcion: "Test de campos de marketing",
        categoriaId,
        jugadoresMin: 2,
        jugadoresMax: 4,
        showInMerchant: true,
        showInMetaCommerce: true,
        allowDynamicAds: true,
        marketingFeatured: true,
        remarketingEligible: true,
        googleProductCategory: "Electronics > Wearable Technology",
        metaProductCategory: "Tecnología",
        gtin: "0702217114061",
        mpn: "WR-TEST-001",
        brand: "Catalogo App",
        condition: "new",
        marketingPriority: 5,
      },
    });
    expect(createRes.status()).toBe(200);
    const created = await createRes.json();
    expect(created.showInMerchant).toBe(true);
    expect(created.showInMetaCommerce).toBe(true);
    expect(created.allowDynamicAds).toBe(true);
    expect(created.marketingFeatured).toBe(true);
    expect(created.remarketingEligible).toBe(true);
    expect(created.googleProductCategory).toBe("Electronics > Wearable Technology");
    expect(created.metaProductCategory).toBe("Tecnología");
    expect(created.gtin).toBe("0702217114061");
    expect(created.mpn).toBe("WR-TEST-001");
    expect(created.brand).toBe("Catalogo App");
    expect(created.condition).toBe("new");
    expect(created.marketingPriority).toBe(5);

    const updateRes = await page.request.put(`/api/admin/productos/${created.id}`, {
      data: {
        nombre: "Producto Marketing Test",
        slug,
        descripcion: "Test de campos de marketing",
        categoriaId,
        jugadoresMin: 2,
        jugadoresMax: 4,
        showInMerchant: false,
        showInMetaCommerce: true,
        allowDynamicAds: false,
        marketingFeatured: false,
        remarketingEligible: true,
        googleProductCategory: "",
        metaProductCategory: "Juegos de mesa",
        gtin: "",
        mpn: "",
        brand: "Catalogo App",
        condition: "refurbished",
        marketingPriority: 0,
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.showInMerchant).toBe(false);
    expect(updated.allowDynamicAds).toBe(false);
    expect(updated.condition).toBe("refurbished");
    expect(updated.gtin).toBe("");
    expect(updated.marketingPriority).toBe(0);

    const listRes = await page.request.get("/api/admin/productos");
    const lista = await listRes.json();
    const persisted = lista.find((g: { id: string }) => g.id === created.id);
    expect(persisted).toBeTruthy();
    expect(persisted.showInMetaCommerce).toBe(true);
    expect(persisted.condition).toBe("refurbished");

    await page.request.delete(`/api/admin/productos/${created.id}`);
  });
});
