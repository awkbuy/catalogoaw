import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

const SITE_URL = "https://catalogo.app";

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@catalogoapp.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

function canonicalHref(html: string): string | null {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null;
}

function ogUrl(html: string): string | null {
  return html.match(/<meta property="og:url" content="([^"]+)"/)?.[1] ?? null;
}

async function createProduct(
  page: Page,
  opts: { nombre: string; slug: string; canonical?: string }
): Promise<{ id: string }> {
  const productos = await (await page.request.get("/api/admin/productos")).json();
  const categoriaId = productos[0].categoriaId;
  const res = await page.request.post("/api/admin/productos", {
    data: {
      nombre: opts.nombre,
      slug: opts.slug,
      descripcion: "Producto de prueba para SEO",
      categoriaId,
      showInMerchant: true,
      disponibleVenta: true,
      canonical: opts.canonical || "",
    },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as { id: string };
}

async function deleteProduct(page: Page, id: string): Promise<void> {
  await page.request.delete(`/api/admin/productos/${id}`);
}

test.describe("SEO - canonical e indexación", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
    await login(page);
  });

  test("producto sin canonical usa la URL real del producto", async ({ page }) => {
    const slug = `seo-auto-${Date.now()}`;
    const created = await createProduct(page, { nombre: "SEO Auto Test", slug });
    try {
      const res = await page.request.get(`/productos/${slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(canonicalHref(html)).toBe(`${SITE_URL}/productos/${slug}`);
      expect(ogUrl(html)).toBe(`${SITE_URL}/productos/${slug}`);
    } finally {
      await deleteProduct(page, created.id);
    }
  });

  test("canonical manual del mismo dominio apuntando a otra ruta se ignora (fallback)", async ({
    page,
  }) => {
    const slug = `seo-sameorigin-${Date.now()}`;
    const created = await createProduct(page, {
      nombre: "SEO Same Origin Test",
      slug,
      canonical: `${SITE_URL}/desconectados`,
    });
    try {
      const html = await (await page.request.get(`/productos/${slug}`)).text();
      expect(canonicalHref(html)).toBe(`${SITE_URL}/productos/${slug}`);
    } finally {
      await deleteProduct(page, created.id);
    }
  });

  test("canonical de otro dominio se respeta", async ({ page }) => {
    const slug = `seo-external-${Date.now()}`;
    const created = await createProduct(page, {
      nombre: "SEO External Test",
      slug,
      canonical: "https://marketplace.ejemplo.com/smartwatch-deportivo",
    });
    try {
      const html = await (await page.request.get(`/productos/${slug}`)).text();
      expect(canonicalHref(html)).toBe("https://marketplace.ejemplo.com/smartwatch-deportivo");
    } finally {
      await deleteProduct(page, created.id);
    }
  });

  test("canonical inválida (texto plano) se ignora", async ({ page }) => {
    const slug = `seo-invalida-${Date.now()}`;
    const created = await createProduct(page, {
      nombre: "SEO Invalida Test",
      slug,
      canonical: "desconectados",
    });
    try {
      const html = await (await page.request.get(`/productos/${slug}`)).text();
      expect(canonicalHref(html)).toBe(`${SITE_URL}/productos/${slug}`);
    } finally {
      await deleteProduct(page, created.id);
    }
  });

  test("sitemap incluye el producto y robots permite la indexación", async ({
    page,
  }) => {
    const slug = `seo-sitemap-${Date.now()}`;
    const created = await createProduct(page, {
      nombre: "SEO Sitemap Test",
      slug,
    });
    try {
      const sitemap = await (await page.request.get("/sitemap.xml")).text();
      expect(sitemap).toContain(`<loc>${SITE_URL}/productos/${slug}</loc>`);

      const robots = await (await page.request.get("/robots.txt")).text();
      expect(robots).toContain("Allow: /");
      expect(robots).toContain("Disallow: /login");
      expect(robots).toContain("Disallow: /dashboard");
      expect(robots).toContain("Disallow: /api/");
      expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    } finally {
      await deleteProduct(page, created.id);
    }
  });
});
