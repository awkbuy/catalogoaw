import { test, expect, assertNoLeak, readBody, randomIp } from "./fixtures";

const PAYLOADS = [
  "' OR 1=1 --",
  "' OR '1'='1",
  "'; DROP TABLE Coupon; --",
  "' UNION SELECT passwordHash FROM User --",
  "1' UNION SELECT sqlite_master FROM sqlite_master --",
  "' OR 1=1 LIMIT 1 --",
];

test.describe("07 · SQL Injection — payloads tratados como datos literales", () => {
  const created: string[] = [];

  test("API pública /api/cupones/validar: payloads SQLi → error genérico, sin SQL ni filtraciones", async ({ publicApi }) => {
    const ip = randomIp();
    for (const payload of PAYLOADS) {
      const res = await publicApi.post("/api/cupones/validar", {
        data: { codigo: payload, subtotal: 100 },
        headers: { "x-forwarded-for": ip },
      });
      // el cupón no existe (se trata literal) → 400 "Cupón no válido", nunca 500
      expect(res.status(), `codigo=${payload}`).toBe(400);
      const body = await readBody(res);
      expect(body).toContain("Cupón no válido");
      assertNoLeak(body, `cupón SQLi (${payload})`);
      expect(body).not.toContain("Syntax error");
      expect(body).not.toContain("sqlite");
    }
  });

  test("admin: crear categoría con SQLi en nombre → se almacena literal y responde limpio", async ({ adminApi }) => {
    const payload = `Cat${Date.now()}'; DROP TABLE Category; --`;
    const res = await adminApi.post("/api/admin/categorias", {
      data: { nombre: payload, color: "#123456" },
    });
    expect(res.status()).toBe(200);
    const body = await readBody(res);
    expect(body).toContain(payload);
    assertNoLeak(body, "categoría SQLi");
    const cat = JSON.parse(body);
    created.push(cat.id);
  });

  test("admin: crear juego con SQLi en nombre y descripción → se almacena literal", async ({ adminApi }) => {
    const cats = await (await adminApi.get("/api/admin/categorias")).json();
    expect(cats.length).toBeGreaterThan(0);

    const nombre = `Juego${Date.now()}'; DROP TABLE Game; --`;
    const descripcion = `' UNION SELECT passwordHash FROM User --`;
    const res = await adminApi.post("/api/admin/juegos", {
      data: {
        nombre,
        descripcion,
        categoriaId: cats[0].id,
        jugadoresMin: 2,
        jugadoresMax: 6,
        duracion: "30 min",
        edad: "8+",
        dificultad: "Normal",
        disponibleVenta: true,
        disponibleMesa: true,
      },
    });
    expect(res.status()).toBe(200);
    const body = await readBody(res);
    expect(body).toContain(nombre);
    expect(body).toContain(descripcion);
    assertNoLeak(body, "juego SQLi");
    created.push(JSON.parse(body).id);
  });

  test("admin: SQLi en el segmento de ruta (id) → 404, no SQL error", async ({ adminApi }) => {
    const cases: [string, string][] = [
      [`/api/admin/juegos/${encodeURIComponent("' OR 1=1--")}`, "GET"],
      [`/api/admin/categorias/${encodeURIComponent("'; DROP TABLE Category;--")}`, "PUT"],
      [`/api/admin/cupones/${encodeURIComponent("' UNION SELECT * FROM User--")}`, "PUT"],
      [`/api/admin/pagos/${encodeURIComponent("1; SELECT * FROM User--")}`, "PUT"],
    ];
    for (const [path, method] of cases) {
      const res = await adminApi.fetch(path, {
        method,
        data: { titulo: "x", descripcion: "x", codigo: "X", nombre: "x" },
      });
      expect(res.status(), `${method} ${path}`).toBe(404);
      const body = await readBody(res);
      assertNoLeak(body, `ruta SQLi ${path}`);
      expect(body).not.toContain("Syntax error");
    }
  });

  test.afterAll(async () => {
    const { request: pwRequest } = await import("@playwright/test");
    const { ADMIN_STATE, BASE_URL } = await import("./fixtures");
    const ctx = await pwRequest.newContext({ baseURL: BASE_URL, storageState: ADMIN_STATE });
    for (const id of created) {
      await ctx.delete(`/api/admin/juegos/${id}`).catch(() => {});
      await ctx.delete(`/api/admin/categorias/${id}`).catch(() => {});
    }
    await ctx.dispose();
  });
});
