import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

const SITE_URL = "https://wolfiesroom.com";

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@wolfieroom.com");
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

async function createGame(
  page: Page,
  opts: { nombre: string; slug: string; canonical?: string }
): Promise<{ id: string }> {
  const juegos = await (await page.request.get("/api/admin/juegos")).json();
  const categoriaId = juegos[0].categoriaId;
  const res = await page.request.post("/api/admin/juegos", {
    data: {
      nombre: opts.nombre,
      slug: opts.slug,
      descripcion: "Juego de prueba para SEO",
      categoriaId,
      showInMerchant: true,
      disponibleVenta: true,
      canonical: opts.canonical || "",
    },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as { id: string };
}

async function deleteGame(page: Page, id: string): Promise<void> {
  await page.request.delete(`/api/admin/juegos/${id}`);
}

test.describe("SEO - canonical e indexación", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
    await login(page);
  });

  test("juego sin canonical usa la URL real del producto", async ({ page }) => {
    const slug = `seo-auto-${Date.now()}`;
    const created = await createGame(page, { nombre: "SEO Auto Test", slug });
    try {
      const res = await page.request.get(`/juegos/${slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(canonicalHref(html)).toBe(`${SITE_URL}/juegos/${slug}`);
      expect(ogUrl(html)).toBe(`${SITE_URL}/juegos/${slug}`);
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("canonical manual del mismo dominio apuntando a otra ruta se ignora (fallback)", async ({
    page,
  }) => {
    const slug = `seo-sameorigin-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "SEO Same Origin Test",
      slug,
      canonical: `${SITE_URL}/desconectados`,
    });
    try {
      const html = await (await page.request.get(`/juegos/${slug}`)).text();
      expect(canonicalHref(html)).toBe(`${SITE_URL}/juegos/${slug}`);
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("canonical de otro dominio se respeta", async ({ page }) => {
    const slug = `seo-external-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "SEO External Test",
      slug,
      canonical: "https://marketplace.ejemplo.com/catan",
    });
    try {
      const html = await (await page.request.get(`/juegos/${slug}`)).text();
      expect(canonicalHref(html)).toBe("https://marketplace.ejemplo.com/catan");
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("canonical inválida (texto plano) se ignora", async ({ page }) => {
    const slug = `seo-invalida-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "SEO Invalida Test",
      slug,
      canonical: "desconectados",
    });
    try {
      const html = await (await page.request.get(`/juegos/${slug}`)).text();
      expect(canonicalHref(html)).toBe(`${SITE_URL}/juegos/${slug}`);
    } finally {
      await deleteGame(page, created.id);
    }
  });

  test("sitemap incluye el juego y robots permite la indexación", async ({
    page,
  }) => {
    const slug = `seo-sitemap-${Date.now()}`;
    const created = await createGame(page, {
      nombre: "SEO Sitemap Test",
      slug,
    });
    try {
      const sitemap = await (await page.request.get("/sitemap.xml")).text();
      expect(sitemap).toContain(`<loc>${SITE_URL}/juegos/${slug}</loc>`);

      const robots = await (await page.request.get("/robots.txt")).text();
      expect(robots).toContain("Allow: /");
      expect(robots).toContain("Disallow: /login");
      expect(robots).toContain("Disallow: /dashboard");
      expect(robots).toContain("Disallow: /api/");
      expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    } finally {
      await deleteGame(page, created.id);
    }
  });
});
