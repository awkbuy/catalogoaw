import { test, expect, assertNoLeak, readBody } from "./fixtures";

test.describe("05 · API — métodos, parámetros, CSRF y JSON", () => {
  test("métodos HTTP: PATCH no soportado → 405; OPTIONS → 204 auto; HEAD → 200 (sin body)", async ({ adminApi }) => {
    // PATCH no está definido en la ruta → 405
    const patch = await adminApi.fetch("/api/admin/settings", { method: "PATCH" });
    expect(patch.status(), "PATCH /api/admin/settings").toBe(405);

    // Next.js auto-implementa OPTIONS (204) cuando no hay handler explícito
    const options = await adminApi.fetch("/api/admin/settings", { method: "OPTIONS" });
    expect(options.status(), "OPTIONS /api/admin/settings").toBe(204);
    const allow = options.headers().allow ?? "";
    expect(allow).toMatch(/GET|POST|PUT|DELETE/);

    // HEAD con sesión válida → 200 (mismo status que GET) y sin cuerpo
    const head = await adminApi.fetch("/api/admin/settings", { method: "HEAD" });
    expect(head.status(), "HEAD /api/admin/settings").toBe(200);
    expect(await head.text()).toBe("");
  });

  test("JSON mal formado → 400 genérico, sin stack trace", async ({ adminApi }) => {
    // POST para rutas con POST; settings usa PUT
    const postPaths = [
      "/api/admin/categorias",
      "/api/admin/juegos",
      "/api/admin/cupones",
      "/api/admin/pagos",
    ];
    for (const path of postPaths) {
      const res = await adminApi.post(path, {
        data: "{esto no es json",
        headers: { "content-type": "application/json" },
      });
      expect(res.status(), `POST ${path} JSON inválido`).toBe(400);
      const body = await readBody(res);
      assertNoLeak(body, `JSON inválido ${path}`);
      expect(body).toContain("JSON inválido");
    }
    const resSettings = await adminApi.put("/api/admin/settings", {
      data: "{esto no es json",
      headers: { "content-type": "application/json" },
    });
    expect(resSettings.status(), "PUT settings JSON inválido").toBe(400);
    const bodySettings = await readBody(resSettings);
    assertNoLeak(bodySettings, "JSON inválido settings");
    expect(bodySettings).toContain("JSON inválido");
  });

  test("Content-Type manipulado → rechazado sin crash", async ({ adminApi }) => {
    const res = await adminApi.post("/api/admin/categorias", {
      data: "not-json",
      headers: { "content-type": "text/plain" },
    });
    expect([400, 415]).toContain(res.status());
    const body = await readBody(res);
    assertNoLeak(body, "content-type manipulado");
  });

  test("IDs inexistentes → 404 (métodos soportados por cada ruta)", async ({ adminApi }) => {
    const cases: [string, string][] = [
      ["/api/admin/juegos/id-no-existe", "GET"],
      ["/api/admin/juegos/id-no-existe", "PUT"],
      ["/api/admin/juegos/id-no-existe", "DELETE"],
      ["/api/admin/categorias/id-no-existe", "PUT"],
      ["/api/admin/categorias/id-no-existe", "DELETE"],
      ["/api/admin/cupones/id-no-existe", "PUT"],
      ["/api/admin/cupones/id-no-existe", "DELETE"],
      ["/api/admin/pagos/id-no-existe", "PUT"],
      ["/api/admin/pagos/id-no-existe", "DELETE"],
    ];
    for (const [path, method] of cases) {
      const res = await adminApi.fetch(path, {
        method,
        data: { nombre: "x", slug: "x", codigo: "X", titulo: "x", descripcion: "x" },
      });
      expect(res.status(), `${method} ${path}`).toBe(404);
      const body = await readBody(res);
      assertNoLeak(body, `${method} ${path}`);
      expect(body).not.toContain("Error interno del servidor");
    }
  });

  test("parámetros inválidos → 400 con mensaje genérico", async ({ adminApi }) => {
    // clave no permitida en settings
    const res = await adminApi.put("/api/admin/settings", {
      data: { password: "secreto", SESSION_SECRET: "leak" },
    });
    expect(res.status()).toBe(400);
    const body = await readBody(res);
    assertNoLeak(body, "settings key inválida");

    // cupón sin código
    const res2 = await adminApi.post("/api/admin/cupones", { data: { valor: 10 } });
    expect(res2.status()).toBe(400);

    // reordenar sin ids
    const res3 = await adminApi.post("/api/admin/pagos/reordenar", { data: {} });
    expect(res3.status()).toBe(400);
  });

  test("CSRF: POST cross-origin sin credenciales → 401 (SameSite bloquea cookie)", async ({ publicApi }) => {
    const res = await publicApi.post("/api/admin/categorias", {
      data: { nombre: "Hackeado" },
      headers: { origin: "https://evil.example", referer: "https://evil.example/" },
    });
    expect(res.status()).toBe(401);
    const body = await readBody(res);
    assertNoLeak(body, "CSRF cross-origin");

    // también para DELETE (mutación destructiva)
    const res2 = await publicApi.delete("/api/admin/pagos/cualquier-id", {
      headers: { origin: "https://evil.example" },
    });
    expect(res2.status()).toBe(401);
  });

  test("las respuestas admin no exponen credenciales ni secretos", async ({ adminApi }) => {
    const res = await adminApi.get("/api/admin/settings");
    expect(res.status()).toBe(200);
    const body = await readBody(res);
    expect(body).not.toContain("SESSION_SECRET");
    expect(body).not.toContain("passwordHash");

    const res2 = await adminApi.get("/api/admin/juegos");
    expect(res2.status()).toBe(200);
    const body2 = await readBody(res2);
    expect(body2).not.toContain("passwordHash");
  });
});
