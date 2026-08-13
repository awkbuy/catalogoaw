import { test, expect, assertNoLeak, BASE_URL } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";

const SITE_URL = BASE_URL;

interface LandingRecord {
  id: string;
  slug: string;
}

async function createLanding(
  api: APIRequestContext,
  opts: Record<string, unknown>
): Promise<LandingRecord> {
  const res = await api.post("/api/admin/landings", {
    data: {
      slug: `landing-sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: "Landing Seguridad",
      ...opts,
    },
  });
  expect(res.status()).toBe(200);
  return res.json() as Promise<LandingRecord>;
}

async function getGameId(api: APIRequestContext): Promise<string> {
  const res = await api.get("/api/admin/productos");
  const productos = await res.json();
  return productos[0].id;
}

test.describe("16 · Landings — acceso, validación de inputs y canonical", () => {
  test("API sin sesión rechaza con 401", async ({ publicApi }) => {
    const res = await publicApi.get("/api/admin/landings");
    expect(res.status()).toBe(401);

    const post = await publicApi.post("/api/admin/landings", {
      data: { slug: "x", title: "y" },
    });
    expect(post.status()).toBe(401);
  });

  test("payload XSS en título y hero no se refleja en la página pública", async ({
    adminApi,
    publicApi,
  }) => {
    const payload = `"><script>alert("landing")</script>`;
    const landing = await createLanding(adminApi, {
      title: payload,
      heroTitle: payload,
      heroDescription: payload,
    });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).not.toContain("<script>alert");
      expect(html).not.toContain(`href="${SITE_URL}/${landing.slug}"><script>`);
      assertNoLeak(html, "landing XSS");
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });

  test("payload SQLi en campos de la landing no se filtra ni rompe", async ({
    adminApi,
    publicApi,
  }) => {
    const payload = `'; DROP TABLE LandingPage;--`;
    const landing = await createLanding(adminApi, {
      title: payload,
      heroTitle: payload,
      seoTitle: payload,
      seoDescription: payload,
    });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      // El payload se almacena literal pero el HTML visible se renderiza escapado
      // (apóstrofe → &#x27;): no rompe el <title> ni los atributos meta.
      expect(
        html
      ).toContain("<title>&#x27;; DROP TABLE LandingPage;-- | Catalogo App</title>");
      expect(html).toContain(
        '<meta name="description" content="&#x27;; DROP TABLE LandingPage;--"/>'
      );
      assertNoLeak(html, "landing SQLi");
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });

  test("productIds con payload malicioso no se refleja y no rompe la página", async ({
    adminApi,
    publicApi,
  }) => {
    const landing = await createLanding(adminApi, {
      productIds: `"><script>alert(1)</script>`,
    });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).not.toContain("<script>alert");
      assertNoLeak(html, "landing productIds XSS");
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });

  test("canonical con payload XSS se ignora (fallback a la URL real)", async ({
    adminApi,
    publicApi,
  }) => {
    const payload = `"><script>alert("canon-landing")</script>`;
    const landing = await createLanding(adminApi, { canonical: payload });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain(
        `<link rel="canonical" href="${SITE_URL}/${landing.slug}"/>`
      );
      expect(html).not.toContain("<script>alert");
      assertNoLeak(html, "landing canonical XSS");
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });

  test("canonical same-origin a ruta inexistente cae a la URL real", async ({
    adminApi,
    publicApi,
  }) => {
    const landing = await createLanding(adminApi, {
      canonical: `${SITE_URL}/ruta-inexistente`,
    });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain(
        `<link rel="canonical" href="${SITE_URL}/${landing.slug}"/>`
      );
      expect(html).not.toContain("ruta-inexistente");
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });

  test("slug reservado es rechazado por la API", async ({ adminApi }) => {
    for (const slug of ["login", "dashboard", "games", "landings", "api"]) {
      const res = await adminApi.post("/api/admin/landings", {
        data: { slug, title: "reservada" },
      });
      expect(res.status(), `slug ${slug} debe ser rechazado`).toBe(400);
    }
  });

  test("productIds inválido (no-array) se normaliza a lista vacía", async ({
    adminApi,
    publicApi,
  }) => {
    const landing = await createLanding(adminApi, {
      productIds: "not-a-json",
    });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(200);
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });

  test("productIds con ids que no existen no rompe la página (no filtra)", async ({
    adminApi,
    publicApi,
  }) => {
    const landing = await createLanding(adminApi, {
      productIds: ["id-inventado-1", "id-inventado-2"],
    });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).not.toContain("id-inventado-1");
      assertNoLeak(html, "landing productIds inexistentes");
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });

  test("landing con productId real renderiza solo los productos asignados", async ({
    adminApi,
    publicApi,
  }) => {
    const productId = await getGameId(adminApi);
    const landing = await createLanding(adminApi, {
      productIds: [productId],
      heroTitle: "Landing Hero Real",
    });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain("Landing Hero Real");
      assertNoLeak(html, "landing productos reales");
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });

  test("landing inactiva no es accesible públicamente (404)", async ({
    adminApi,
    publicApi,
  }) => {
    const landing = await createLanding(adminApi, { isActive: false });
    try {
      const res = await publicApi.get(`/${landing.slug}`);
      expect(res.status()).toBe(404);
      const html = await res.text();
      assertNoLeak(html, "landing inactiva 404");
    } finally {
      await adminApi.delete(`/api/admin/landings/${landing.id}`);
    }
  });
});
