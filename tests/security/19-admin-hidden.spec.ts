import { test, expect } from "./fixtures";
import { ADMIN_PATH } from "./fixtures";

test.describe("19 · Admin oculto — ruta secreta y no-indexación", () => {
  test("login y rutas del panel sin prefijo → 404 (desaparecen de la URL pública)", async ({ publicApi }) => {
    for (const path of ["/login", "/dashboard", "/productos", "/settings", "/marketing"]) {
      const res = await publicApi.get(path);
      expect(res.status(), `${path} sin prefijo`).toBe(404);
    }
  });

  test("dashboard con prefijo sin sesión → redirige al login del prefijo", async ({ page }) => {
    await page.goto(`/${ADMIN_PATH}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${ADMIN_PATH}/login`), {
      timeout: 10_000,
    });
    const html = await page.content();
    expect(html).not.toContain("Total Productos");
  });

  test("login del prefijo responde 200 con X-Robots-Tag noindex y meta noindex", async ({ publicApi }) => {
    const res = await publicApi.get(`/${ADMIN_PATH}/login`);
    expect(res.status()).toBe(200);
    const tag = res.headers()["x-robots-tag"] || "";
    expect(tag).toContain("noindex");
    const html = await res.text();
    expect(html).toContain("noindex");
    expect(html).not.toContain(`<title>Catalogo App</title>`);
  });

  test("la página pública NO lleva X-Robots-Tag noindex", async ({ publicApi }) => {
    const res = await publicApi.get("/");
    expect(res.status()).toBe(200);
    const tag = res.headers()["x-robots-tag"] || "";
    expect(tag).not.toContain("noindex");
  });

  test("robots.txt disallows login, dashboard y /api/", async ({ publicApi }) => {
    const res = await publicApi.get("/robots.txt");
    const text = await res.text();
    expect(text).toContain("Disallow: /login");
    expect(text).toContain("Disallow: /dashboard");
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Sitemap:");
  });

  test("login y dashboard no aparecen en el sitemap", async ({ publicApi }) => {
    const sitemap = await (await publicApi.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/login");
    expect(sitemap).not.toContain("/dashboard");
  });
});
