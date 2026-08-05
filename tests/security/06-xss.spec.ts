import { test, expect, assertNoLeak, readBody } from "./fixtures";
import { request as pwRequest } from "@playwright/test";
import { ADMIN_STATE, BASE_URL } from "./fixtures";

const MARKERS = [1, 2, 3, 4, 5, 6, 7, 8];

const XSS_GAME = {
  nombre: `Juego <img src=x onerror="window.__xss=1"> ${Date.now()}`,
  descripcion: `<script>window.__xss=2</script>`,
  seoTitle: `<iframe onload="window.__xss=3"></iframe>`,
  seoDescription: `<a href="javascript:window.__xss=4">enlace</a>`,
  seoKeywords: `<svg onload="window.__xss=5"></svg>`,
  resumenIA: `</script><script>window.__xss=6</script>`,
  descripcionAccesible: `"><img src=x onerror="window.__xss=7">`,
};

test.describe("06 · XSS — inyección nunca se ejecuta", () => {
  const created = { gameId: "", gameSlug: "", categoryId: "" };
  let originalSettings: Record<string, string> = {};

  test.beforeAll(async () => {
    const ctx = await pwRequest.newContext({ baseURL: BASE_URL, storageState: ADMIN_STATE });
    originalSettings = await (await ctx.get("/api/admin/settings")).json();
    await ctx.dispose();
  });

  test("crea juego y categoría con payloads XSS vía API (se almacenan literales)", async ({ adminApi }) => {
    const cats = await (await adminApi.get("/api/admin/categorias")).json();
    expect(cats.length).toBeGreaterThan(0);
    const catId = cats[0].id;

    const catRes = await adminApi.post("/api/admin/categorias", {
      data: { nombre: `<svg onload="window.__xss=8"></svg>${Date.now()}`, color: "#123456" },
    });
    expect(catRes.status()).toBe(200);
    const cat = await catRes.json();
    created.categoryId = cat.id;
    // se almacena literal, sin error SQL
    const catBody = await readBody(catRes);
    expect(catBody).toContain("onload");
    assertNoLeak(catBody, "categoría XSS");

    const gameRes = await adminApi.post("/api/admin/juegos", {
      data: {
        ...XSS_GAME,
        slug: `xss-test-${Date.now()}`,
        categoriaId: catId,
        jugadoresMin: 2,
        jugadoresMax: 6,
        duracion: "30 min",
        edad: "8+",
        dificultad: "Normal",
        disponibleVenta: true,
        disponibleMesa: true,
      },
    });
    expect(gameRes.status()).toBe(200);
    const game = await gameRes.json();
    created.gameId = game.id;
    created.gameSlug = game.slug;
    const gameBody = await readBody(gameRes);
    expect(gameBody).toContain("<script>window.__xss=2</script>");
    expect(gameBody).toContain("onload");
    assertNoLeak(gameBody, "juego XSS");
  });

  test("home + detalle del juego: los payloads XSS no se ejecutan", async ({ page }) => {
    const fired: string[] = [];
    page.on("dialog", async (d) => {
      fired.push("dialog");
      await d.dismiss();
    });
    page.on("pageerror", (e) => {
      if (String(e).includes("__xss")) fired.push("pageerror");
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (const m of MARKERS) {
      const v = await page.evaluate((x) => (window as any)["__xss"], m);
      expect(v, `window.__xss en / no debe existir (marker ${m})`).toBeUndefined();
    }
    expect(fired.length).toBe(0);

    if (created.gameSlug) {
      await page.goto(`/juegos/${created.gameSlug}`, { waitUntil: "domcontentloaded" });
      for (const m of MARKERS) {
        const v = await page.evaluate((x) => (window as any)["__xss"], m);
        expect(v, `window.__xss en detalle no debe existir (marker ${m})`).toBeUndefined();
      }
      expect(fired.length).toBe(0);
    }

    // los bloques application/ld+json no deben contener </script> literal
    const ld = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
        (s) => s.textContent || ""
      )
    );
    for (const json of ld) {
      expect(json).not.toContain("</script>");
    }
  });

  test("JSON-LD escapa payloads de organización (configuración SEO)", async ({ page, adminApi }) => {
    const evil = `</script><script>window.__xss="ld"></script><img src=x onerror="window.__xss='ld2'">`;
    const res = await adminApi.put("/api/admin/settings", {
      data: { seoTitulo: evil, orgNombre: evil },
    });
    expect(res.status()).toBe(200);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const v = await page.evaluate(() => (window as any).__xss);
    expect(v).toBeUndefined();

    const ld = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
        (s) => s.textContent || ""
      )
    );
    expect(ld.length).toBeGreaterThan(0);
    for (const json of ld) {
      expect(json).not.toContain("</script>");
      expect(json).not.toContain('"ld"');
    }
  });

  test.afterAll(async () => {
    const ctx = await pwRequest.newContext({ baseURL: BASE_URL, storageState: ADMIN_STATE });
    if (created.gameId) {
      await ctx.delete(`/api/admin/juegos/${created.gameId}`).catch(() => {});
    }
    if (created.categoryId) {
      await ctx.delete(`/api/admin/categorias/${created.categoryId}`).catch(() => {});
    }
    // restaurar settings tocados
    const restore: Record<string, string> = {};
    for (const k of ["seoTitulo", "orgNombre"]) {
      if (k in originalSettings) restore[k] = originalSettings[k];
    }
    if (Object.keys(restore).length > 0) {
      await ctx.put("/api/admin/settings", { data: restore }).catch(() => {});
    }
    await ctx.dispose();
  });
});
