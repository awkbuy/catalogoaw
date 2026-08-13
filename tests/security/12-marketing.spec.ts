import { test, expect, assertNoLeak, readBody } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";

async function getCategoriaId(api: APIRequestContext): Promise<string> {
  const res = await api.get("/api/admin/productos");
  const productos = await res.json();
  return productos[0].categoriaId;
}

test.describe("12 · Marketing — campos por producto (validación y no-filtración)", () => {
  test("payloads XSS/SQLi en campos marketing → 200, sin filtración", async ({ adminApi }) => {
    const categoriaId = await getCategoriaId(adminApi);
    const payloads = [
      `<script>alert(1)</script>`,
      `' OR '1'='1`,
      `'; DROP TABLE Product;--`,
      `<img src=x onerror=alert(1)>`,
    ];
    for (const payload of payloads) {
      const res = await adminApi.post("/api/admin/productos", {
        data: {
          nombre: "x",
          slug: `marketing-sec-${Date.now()}-${payloads.indexOf(payload)}`,
          categoriaId,
          gtin: payload,
          mpn: payload,
          brand: payload,
          googleProductCategory: payload,
          metaProductCategory: payload,
        },
      });
      expect([200]).toContain(res.status());
      const body = await readBody(res);
      assertNoLeak(body, `payload marketing ${payload}`);
    }
  });

  test("booleans inválidos se normalizan a false", async ({ adminApi }) => {
    const categoriaId = await getCategoriaId(adminApi);
    const res = await adminApi.post("/api/admin/productos", {
      data: {
        nombre: "x",
        slug: `marketing-sec-bool-${Date.now()}`,
        categoriaId,
        showInMerchant: "yes",
        showInMetaCommerce: 1,
        allowDynamicAds: null,
        marketingFeatured: {},
        remarketingEligible: [],
      },
    });
    expect(res.status()).toBe(200);
    const created = await res.json();
    expect(created.showInMerchant).toBe(false);
    expect(created.showInMetaCommerce).toBe(false);
    expect(created.allowDynamicAds).toBe(false);
    expect(created.marketingFeatured).toBe(false);
    expect(created.remarketingEligible).toBe(false);
  });

  test("marketingPriority negativo o no numérico → 0", async ({ adminApi }) => {
    const categoriaId = await getCategoriaId(adminApi);
    const res = await adminApi.post("/api/admin/productos", {
      data: {
        nombre: "x",
        slug: `marketing-sec-prio-${Date.now()}`,
        categoriaId,
        marketingPriority: -50,
      },
    });
    expect(res.status()).toBe(200);
    const created = await res.json();
    expect(created.marketingPriority).toBe(0);
  });

  test("string numérico en marketingPriority se convierte", async ({ adminApi }) => {
    const categoriaId = await getCategoriaId(adminApi);
    const res = await adminApi.post("/api/admin/productos", {
      data: {
        nombre: "x",
        slug: `marketing-sec-priostr-${Date.now()}`,
        categoriaId,
        marketingPriority: "7",
      },
    });
    expect(res.status()).toBe(200);
    const created = await res.json();
    expect(created.marketingPriority).toBe(7);
  });

  test("POST /api/admin/productos sin sesión → 401", async ({ publicApi }) => {
    const res = await publicApi.post("/api/admin/productos", {
      data: { nombre: "x", slug: `marketing-sec-unauth-${Date.now()}` },
    });
    expect(res.status()).toBe(401);
    const body = await readBody(res);
    assertNoLeak(body, "POST productos sin sesión");
  });
});
