import { test, expect, assertNoLeak, BASE_URL } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";

const SITE_URL = BASE_URL;

async function getCategoriaId(api: APIRequestContext): Promise<string> {
  const res = await api.get("/api/admin/productos");
  const productos = await res.json();
  return productos[0].categoriaId;
}

async function createSeoProduct(
  api: APIRequestContext,
  canonical: string
): Promise<{ id: string; slug: string }> {
  const categoriaId = await getCategoriaId(api);
  const slug = `seo-sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const res = await api.post("/api/admin/productos", {
    data: {
      nombre: "SEO Sec Test",
      slug,
      descripcion: "contenido de prueba seo",
      categoriaId,
      showInMerchant: true,
      canonical,
    },
  });
  expect(res.status()).toBe(200);
  return res.json() as Promise<{ id: string; slug: string }>;
}

test.describe("15 · SEO — canonical nunca refleja payloads ni apunta a 404", () => {
  test("canonical con payload XSS se ignora (fallback) sin reflejarse", async ({
    adminApi,
    publicApi,
  }) => {
    const payload = `"><script>alert("canon")</script>`;
    const product = await createSeoProduct(adminApi, payload);
    try {
      const res = await publicApi.get(`/productos/${product.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain(
        `<link rel="canonical" href="${SITE_URL}/productos/${product.slug}"/>`
      );
      expect(html).not.toContain("<script>alert");
      assertNoLeak(html, "canonical XSS");
    } finally {
      await adminApi.delete(`/api/admin/productos/${product.id}`);
    }
  });

  test("canonical same-origin a ruta inexistente cae a la URL real (sin 404)", async ({
    adminApi,
    publicApi,
  }) => {
    const product = await createSeoProduct(adminApi, `${SITE_URL}/desconectados`);
    try {
      const res = await publicApi.get(`/productos/${product.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain(
        `<link rel="canonical" href="${SITE_URL}/productos/${product.slug}"/>`
      );
      expect(html).not.toContain(`canonical" href="${SITE_URL}/desconectados`);
    } finally {
      await adminApi.delete(`/api/admin/productos/${product.id}`);
    }
  });

  test("canonical con payload SQLi se almacena literal pero no se refleja ni filtra", async ({
    adminApi,
    publicApi,
  }) => {
    const payload = `'; DROP TABLE Product;--`;
    const product = await createSeoProduct(adminApi, payload);
    try {
      const res = await publicApi.get(`/productos/${product.slug}`);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain(
        `<link rel="canonical" href="${SITE_URL}/productos/${product.slug}"/>`
      );
      expect(html).not.toContain("DROP TABLE");
      assertNoLeak(html, "canonical SQLi");
    } finally {
      await adminApi.delete(`/api/admin/productos/${product.id}`);
    }
  });
});
