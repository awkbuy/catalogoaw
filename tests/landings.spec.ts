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

async function createGame(page: Page, slug: string): Promise<{ id: string }> {
  const juegos = await (await page.request.get("/api/admin/juegos")).json();
  const categoriaId = juegos[0].categoriaId;
  const res = await page.request.post("/api/admin/juegos", {
    data: {
      nombre: `Landing Game ${Date.now()}`,
      slug,
      descripcion: "Juego de prueba para landings",
      categoriaId,
      disponibleVenta: true,
      precioFinalVenta: "15000",
      showInMerchant: true,
    },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as { id: string };
}

async function deleteGame(page: Page, id: string): Promise<void> {
  await page.request.delete(`/api/admin/juegos/${id}`);
}

interface CreateLandingOptions {
  slug: string;
  title?: string;
  heroTitle?: string;
  heroDescription?: string;
  isActive?: boolean;
  gameIds?: string[];
  canonical?: string;
  seoTitle?: string;
  seoDescription?: string;
}

async function createLanding(
  page: Page,
  opts: CreateLandingOptions
): Promise<{ id: string }> {
  const res = await page.request.post("/api/admin/landings", {
    data: {
      slug: opts.slug,
      title: opts.title || "Landing de prueba",
      description: "Descripción de prueba",
      heroTitle: opts.heroTitle || "",
      heroDescription: opts.heroDescription || "",
      bannerColor: "#31D3A9",
      gameIds: opts.gameIds || [],
      isActive: opts.isActive ?? true,
      canonical: opts.canonical || "",
      seoTitle: opts.seoTitle || "",
      seoDescription: opts.seoDescription || "",
    },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as { id: string };
}

async function deleteLanding(page: Page, id: string): Promise<void> {
  await page.request.delete(`/api/admin/landings/${id}`);
}

function canonicalHref(html: string): string | null {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null;
}

test.describe("Landing pages", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
    await login(page);
  });

  test("landing activa se renderiza pública con hero y juegos asignados", async ({
    page,
  }) => {
    const slug = `landing-publica-${Date.now()}`;
    const game = await createGame(page, `landing-game-${Date.now()}`);
    const landing = await createLanding(page, {
      slug,
      title: "Campaña de Otoño",
      heroTitle: "Ofertas de Otoño",
      heroDescription: "Hasta 40% off en juegos de mesa",
      gameIds: [game.id],
    });
    try {
      const res = await page.request.get(`/${slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain("Ofertas de Otoño");
      expect(html).toContain("Hasta 40% off en juegos de mesa");
      expect(html).toContain("Landing Game");
      expect(html).toContain(`id="catalogo"`);
    } finally {
      await deleteLanding(page, landing.id);
      await deleteGame(page, game.id);
    }
  });

  test("landing inactiva devuelve 404", async ({ page }) => {
    const slug = `landing-inactiva-${Date.now()}`;
    const landing = await createLanding(page, { slug, isActive: false });
    try {
      const res = await page.request.get(`/${slug}`);
      expect(res.status()).toBe(404);
    } finally {
      await deleteLanding(page, landing.id);
    }
  });

  test("slug inexistente devuelve 404", async ({ page }) => {
    const res = await page.request.get(`/landing-no-existe-${Date.now()}`);
    expect(res.status()).toBe(404);
  });

  test("metadata SEO de la landing usa campos propios y canonical correcta", async ({
    page,
  }) => {
    const slug = `landing-seo-${Date.now()}`;
    const landing = await createLanding(page, {
      slug,
      title: "Campaña SEO",
      heroTitle: "Hero SEO",
      seoTitle: "Título SEO Custom",
      seoDescription: "Descripción SEO custom",
    });
    try {
      const html = await (await page.request.get(`/${slug}`)).text();
      expect(html).toContain("<title>Título SEO Custom");
      expect(html).toContain("Descripción SEO custom");
      expect(canonicalHref(html)).toBe(`${SITE_URL}/${slug}`);
    } finally {
      await deleteLanding(page, landing.id);
    }
  });

  test("sitemap incluye las landings activas", async ({ page }) => {
    const slug = `landing-sitemap-${Date.now()}`;
    const landing = await createLanding(page, { slug });
    try {
      const sitemap = await (await page.request.get("/sitemap.xml")).text();
      expect(sitemap).toContain(`<loc>${SITE_URL}/${slug}</loc>`);
    } finally {
      await deleteLanding(page, landing.id);
    }
  });

  test("toggle activo/inactivo desde el admin funciona", async ({ page }) => {
    const slug = `landing-toggle-${Date.now()}`;
    const landing = await createLanding(page, { slug });

    const res = await page.request.put(`/api/admin/landings/${landing.id}`, {
      data: {
        slug,
        title: "Landing toggle",
        isActive: false,
      },
    });
    expect(res.status()).toBe(200);

    const inactive = await page.request.get(`/${slug}`);
    expect(inactive.status()).toBe(404);

    const reactivate = await page.request.put(`/api/admin/landings/${landing.id}`, {
      data: {
        slug,
        title: "Landing toggle",
        isActive: true,
      },
    });
    expect(reactivate.status()).toBe(200);

    const active = await page.request.get(`/${slug}`);
    expect(active.status()).toBe(200);

    await deleteLanding(page, landing.id);
  });

  test("slug reservado del sistema es rechazado por la API", async ({ page }) => {
    const res = await page.request.post("/api/admin/landings", {
      data: {
        slug: "dashboard",
        title: "Landing reservada",
      },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("reservado");
  });

  test("admin lista landings y permite crear desde la UI", async ({ page }) => {
    await page.goto("/landings");
    await expect(page.getByRole("heading", { name: "Landings" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Nueva landing/i })).toBeVisible();
  });
});
