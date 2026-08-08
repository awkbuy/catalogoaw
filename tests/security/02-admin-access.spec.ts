import { test, expect, assertNoLeak, readBody } from "./fixtures";

const ADMIN_PAGES = [
  "/dashboard",
  "/marketing",
  "/games",
  "/games/new",
  "/categories",
  "/cupones",
  "/pagos",
  "/horarios",
  "/settings",
  "/seo",
  "/account",
];

const ADMIN_APIS = [
  "/api/admin/settings",
  "/api/admin/pagos",
  "/api/admin/juegos",
  "/api/admin/cupones",
  "/api/admin/categorias",
  "/api/admin/marketing/dashboard",
];

test.describe("02 · Panel admin — acceso sin autenticación", () => {
  for (const path of ADMIN_PAGES) {
    test(`página ${path} sin sesión → redirige a /login sin entregar datos`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // page.goto() sigue el redirect: el assertion clave es que se termina en /login
      // y que no se entrega ningún dato del panel (no existe 200 con contenido admin).
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
      const html = await page.content();
      // el contenido admin no debe estar presente
      expect(html).not.toContain("Dashboard");
      expect(html).not.toContain("Total Juegos");
    });
  }

  test("rutas /admin, /admin/juegos y /admin/configuracion no exponen panel", async ({ page }) => {
    for (const path of ["/admin", "/admin/juegos", "/admin/configuracion"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      // 404 (no existe) o redirect; nunca 200 con contenido admin
      expect([307, 308, 404]).toContain(status);
      const html = await page.content();
      expect(html).not.toContain("Total Juegos");
    }
  });

  for (const path of ADMIN_APIS) {
    test(`API ${path} sin sesión → 401 sin datos`, async ({ publicApi }) => {
      const res = await publicApi.get(path);
      expect(res.status()).toBe(401);
      const body = await readBody(res);
      assertNoLeak(body, `GET ${path}`);
      expect(body).not.toContain("password");
    });
  }

  test("API admin POST sin sesión → 401 (no muta datos)", async ({ publicApi }) => {
    const res = await publicApi.post("/api/admin/categorias", {
      data: { nombre: "NoDeberíaCrearse" },
    });
    expect(res.status()).toBe(401);
    const body = await readBody(res);
    assertNoLeak(body, "POST sin sesión");
  });

  test("upload sin sesión → 401 (POST)", async ({ publicApi }) => {
    const res = await publicApi.post("/api/admin/upload", {
      multipart: {
        file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("abc") },
      },
    });
    expect(res.status()).toBe(401);
  });

  test("API admin DELETE sin sesión → 401", async ({ publicApi }) => {
    const res = await publicApi.delete("/api/admin/juegos/inexistente");
    expect(res.status()).toBe(401);
  });

  test("API admin con ID en URL sin sesión → 401 (no revela existencia)", async ({ publicApi }) => {
    // cada ruta [id] soporta métodos distintos; sin sesión todas deben dar 401
    const cases: [string, string][] = [
      ["/api/admin/juegos/cualquier-id", "GET"],
      ["/api/admin/categorias/cualquier-id", "PUT"],
      ["/api/admin/cupones/cualquier-id", "PUT"],
      ["/api/admin/pagos/cualquier-id", "PUT"],
    ];
    for (const [path, method] of cases) {
      const res = await publicApi.fetch(path, {
        method,
        data: { titulo: "x", nombre: "x" },
      });
      expect(res.status(), `${method} ${path}`).toBe(401);
      const body = await readBody(res);
      assertNoLeak(body, `${method} ${path}`);
    }
  });
});
