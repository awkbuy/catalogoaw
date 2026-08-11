import { test, expect, assertNoLeak, readBody } from "./fixtures";

test.describe("18 · Ventas — zonas de envío y validación de inputs", () => {
  test("GET /api/admin/envios sin sesión → 401 sin datos", async ({ publicApi }) => {
    const res = await publicApi.get("/api/admin/envios");
    expect(res.status()).toBe(401);
    const body = await readBody(res);
    assertNoLeak(body, "GET envios sin sesión");
  });

  test("POST /api/admin/envios sin sesión → 401 (no muta datos)", async ({ publicApi }) => {
    const res = await publicApi.post("/api/admin/envios", {
      data: { name: "NoDeberíaCrearse", cost: 100 },
    });
    expect(res.status()).toBe(401);
    const body = await readBody(res);
    assertNoLeak(body, "POST envios sin sesión");
  });

  test("[id] PUT/DELETE sin sesión → 401 (no revela existencia)", async ({ publicApi }) => {
    for (const method of ["PUT", "DELETE"] as const) {
      const res = await publicApi.fetch("/api/admin/envios/cualquier-id", {
        method,
        data: { name: "x", cost: 0 },
      });
      expect(res.status(), `${method} /api/admin/envios/:id`).toBe(401);
      const body = await readBody(res);
      assertNoLeak(body, `${method} envios sin sesión`);
    }
  });

  test("crear zona con nombre vacío → 400 sin reflejar input del atacante", async ({ adminApi }) => {
    const res = await adminApi.post("/api/admin/envios", {
      data: {
        name: "   ",
        cost: 1000,
        xss: "<script>alert(1)</script>",
      },
    });
    expect(res.status()).toBe(400);
    const body = await readBody(res);
    expect(body).toContain("Ingresá un nombre");
    expect(body).not.toContain("<script>");
    assertNoLeak(body, "POST nombre vacío");
  });

  test("costos negativos se normalizan a 0 y datos maliciosos no rompen el servidor", async ({
    adminApi,
  }) => {
    const res = await adminApi.post("/api/admin/envios", {
      data: {
        name: "Zona <b>Test</b>",
        cost: -5000,
        freeFrom: -1,
        active: true,
        order: 99,
      },
    });
    expect(res.status()).toBe(200);
    const body = await readBody(res);
    assertNoLeak(body, "POST costos negativos");
    const json = JSON.parse(body) as { id: string; cost: number; freeFrom: number };
    expect(json.cost).toBe(0);
    expect(json.freeFrom).toBe(0);
    await adminApi.delete(`/api/admin/envios/${json.id}`);
  });

  test("nombres con tags se guardan como JSON, nunca como HTML ejecutable", async ({
    adminApi,
  }) => {
    const payload = '<img src=x onerror="alert(1)">';
    const res = await adminApi.post("/api/admin/envios", {
      data: { name: payload, cost: 0 },
    });
    expect(res.status()).toBe(200);
    const contentType = res.headers()["content-type"] || "";
    expect(contentType).toContain("application/json");
    const body = await readBody(res);
    assertNoLeak(body, "POST tag xss");
    const json = JSON.parse(body) as { id: string; name: string };
    expect(json.name).toContain("img");
    await adminApi.delete(`/api/admin/envios/${json.id}`);
  });

  test("consultar se guarda como booleano estricto y no refleja input del atacante", async ({
    adminApi,
  }) => {
    const res = await adminApi.post("/api/admin/envios", {
      data: {
        name: "Zona Consultar",
        cost: 5000,
        consultar: true,
        xss: "<img src=x onerror=alert(1)>",
      },
    });
    expect(res.status()).toBe(200);
    const body = await readBody(res);
    assertNoLeak(body, "POST consultar");
    const json = JSON.parse(body) as { id: string; consultar: boolean; cost: number };
    expect(json.consultar).toBe(true);
    expect(json.cost).toBe(5000);

    const res2 = await adminApi.post("/api/admin/envios", {
      data: { name: "Zona Consultar Garbage", consultar: "true", cost: 1000 },
    });
    expect(res2.status()).toBe(200);
    const json2 = JSON.parse(await readBody(res2)) as { id: string; consultar: boolean };
    expect(json2.consultar).toBe(false);

    await adminApi.delete(`/api/admin/envios/${json.id}`);
    await adminApi.delete(`/api/admin/envios/${json2.id}`);
  });
});
