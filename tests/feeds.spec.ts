import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@wolfieroom.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

interface CreateGameOptions {
  nombre: string;
  slug: string;
  showInMerchant?: boolean;
  showInMetaCommerce?: boolean;
  disponibleVenta?: boolean;
  precioFinalVenta?: string;
  descuento?: number;
  gtin?: string;
  mpn?: string;
  brand?: string;
  condition?: string;
  googleProductCategory?: string;
  metaProductCategory?: string;
  descripcion?: string;
}

async function createGame(page: Page, opts: CreateGameOptions): Promise<{ id: string }> {
  const juegos = await (await page.request.get("/api/admin/juegos")).json();
  const categoriaId = juegos[0].categoriaId;
  const res = await page.request.post("/api/admin/juegos", {
    data: {
      nombre: opts.nombre,
      slug: opts.slug,
      descripcion: opts.descripcion || "Juego de prueba para feeds",
      categoriaId,
      jugadoresMin: 2,
      jugadoresMax: 4,
      showInMerchant: opts.showInMerchant ?? false,
      showInMetaCommerce: opts.showInMetaCommerce ?? false,
      disponibleVenta: opts.disponibleVenta ?? true,
      precioFinalVenta: opts.precioFinalVenta ?? "25000",
      descuento: opts.descuento ?? 0,
      gtin: opts.gtin ?? "",
      mpn: opts.mpn ?? "",
      brand: opts.brand ?? "Wolfie Room",
      condition: opts.condition ?? "new",
      googleProductCategory: opts.googleProductCategory ?? "",
      metaProductCategory: opts.metaProductCategory ?? "",
    },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as { id: string };
}

async function deleteGame(page: Page, id: string): Promise<void> {
  await page.request.delete(`/api/admin/juegos/${id}`);
}

test.describe("Feeds de productos", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
    await login(page);
  });

  test("google/xml incluye juegos con showInMerchant y precio, con formato válido", async ({ page }) => {
    const slug = `feed-google-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "Feed Google Test",
      slug,
      showInMerchant: true,
      showInMetaCommerce: true,
      precioFinalVenta: "25000",
      gtin: "0702217114061",
      mpn: "WR-FEED-001",
      googleProductCategory: "Toys & Games > Games > Board Games",
    });
    try {
      const res = await page.request.get("/api/feeds/google/xml");
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("application/xml");
      const xml = await res.text();

      expect(xml).toContain(`<g:id>${created.id}</g:id>`);
      expect(xml).toContain("<g:title>Feed Google Test</g:title>");
      expect(xml).toContain("<g:price>25000.00 ARS</g:price>");
      expect(xml).toContain("<g:availability>in stock</g:availability>");
      expect(xml).toContain("<g:condition>new</g:condition>");
      expect(xml).toContain(`<g:link>https://wolfiesroom.com/juegos/${slug}</g:link>`);
      expect(xml).toContain("<g:gtin>0702217114061</g:gtin>");
      expect(xml).toContain("<g:mpn>WR-FEED-001</g:mpn>");
      expect(xml).toContain("<g:google_product_category>Toys &amp; Games &gt; Games &gt; Board Games</g:google_product_category>");
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("meta/xml y meta/csv incluyen juegos con showInMetaCommerce", async ({ page }) => {
    const slug = `feed-meta-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "Feed Meta Test",
      slug,
      showInMetaCommerce: true,
      metaProductCategory: "Juegos de mesa",
    });
    try {
      const xmlRes = await page.request.get("/api/feeds/meta/xml");
      expect(xmlRes.status()).toBe(200);
      const xml = await xmlRes.text();
      expect(xml).toContain(`<g:id>${created.id}</g:id>`);
      expect(xml).toContain("<g:title>Feed Meta Test</g:title>");
      expect(xml).toContain("<g:product_type>Juegos de mesa</g:product_type>");

      const csvRes = await page.request.get("/api/feeds/meta/csv");
      expect(csvRes.status()).toBe(200);
      expect(csvRes.headers()["content-type"]).toContain("text/csv");
      const csv = await csvRes.text();
      const lines = csv.trim().split("\n");
      expect(lines[0]).toBe("id,title,description,availability,condition,price,link,image_link,brand,gtin,mpn,product_type,google_product_category");
      expect(lines.some((l) => l.startsWith(`${created.id},`))).toBe(true);
      expect(csv).toContain(`${created.id},Feed Meta Test`);
      expect(csv).toContain("25000.00 ARS");
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("juego sin flags de feed no aparece en ningún feed", async ({ page }) => {
    const slug = `feed-excluido-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "Feed Excluido Test",
      slug,
      showInMerchant: false,
      showInMetaCommerce: false,
    });
    try {
      const google = await (await page.request.get("/api/feeds/google/xml")).text();
      const metaXml = await (await page.request.get("/api/feeds/meta/xml")).text();
      const metaCsv = await (await page.request.get("/api/feeds/meta/csv")).text();
      const json = await (await page.request.get("/api/feeds/products/json")).json();

      expect(google).not.toContain(created.id);
      expect(metaXml).not.toContain(created.id);
      expect(metaCsv).not.toContain(created.id);
      expect(json.some((g: { id: string }) => g.id === created.id)).toBe(false);
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("juego sin stock se incluye como out of stock", async ({ page }) => {
    const slug = `feed-sinstock-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "Feed Sin Stock Test",
      slug,
      showInMerchant: true,
      disponibleVenta: false,
      precioFinalVenta: "10000",
    });
    try {
      const xml = await (await page.request.get("/api/feeds/google/xml")).text();
      expect(xml).toContain(`<g:id>${created.id}</g:id>`);
      expect(xml).toContain("<g:availability>out of stock</g:availability>");
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("juego sin precio se excluye del feed de Google", async ({ page }) => {
    const slug = `feed-sinprecio-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "Feed Sin Precio Test",
      slug,
      showInMerchant: true,
      disponibleVenta: true,
      precioFinalVenta: "",
    });
    try {
      const xml = await (await page.request.get("/api/feeds/google/xml")).text();
      expect(xml).not.toContain(created.id);
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("products/json expone campos de marketing", async ({ page }) => {
    const slug = `feed-json-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "Feed JSON Test",
      slug,
      showInMerchant: true,
      precioFinalVenta: "30000",
      descuento: 10,
      gtin: "0123456789012",
      brand: "Wolfie Room",
      googleProductCategory: "Toys & Games",
    });
    try {
      const json = await (await page.request.get("/api/feeds/products/json")).json();
      const item = json.find((g: { id: string }) => g.id === created.id);
      expect(item).toBeTruthy();
      expect(item.nombre).toBe("Feed JSON Test");
      expect(item.precioFinalVenta).toBe(27000);
      expect(item.moneda).toBe("ARS");
      expect(item.disponibilidad).toBe("in stock");
      expect(item.showInMerchant).toBe(true);
      expect(item.showInMetaCommerce).toBe(false);
      expect(item.gtin).toBe("0123456789012");
      expect(item.brand).toBe("Wolfie Room");
      expect(item.url).toContain(`/juegos/${slug}`);
    } finally {
      await deleteGame(page, created.id);
    }
  });
});
