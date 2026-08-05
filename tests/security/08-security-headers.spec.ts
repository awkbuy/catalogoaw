import { test, expect } from "./fixtures";

const REQUIRED_HEADERS: Record<string, RegExp> = {
  "x-frame-options": /^DENY$/,
  "x-content-type-options": /^nosniff$/,
  "referrer-policy": /^strict-origin-when-cross-origin$/,
  "x-xss-protection": /^1;\s*mode=block$/,
  "permissions-policy": /camera=\(\)/,
  "strict-transport-security": /^max-age=\d+; includeSubDomains/,
  "content-security-policy": /default-src 'self'/,
};

test.describe("08 · Headers HTTP — cabeceras de seguridad presentes", () => {
  test("la página de inicio incluye todas las cabeceras de seguridad", async ({ publicApi }) => {
    const res = await publicApi.get("/");
    expect(res.status()).toBe(200);
    for (const [name, pattern] of Object.entries(REQUIRED_HEADERS)) {
      const value = res.headers()[name];
      expect(value, `header ${name} presente`).toBeDefined();
      expect(value!, `header ${name} con valor esperado`).toMatch(pattern);
    }
  });

  test("CSP: frame-ancestors 'none', solo orígenes externos de Google/YouTube", async ({ publicApi }) => {
    const res = await publicApi.get("/");
    const csp = res.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("form-action 'self'");
    // no debe permitir conexiones ni scripts de orígenes externos arbitrarios
    expect(csp).not.toContain("connect-src *");
    expect(csp).not.toContain("script-src *");
    expect(csp).not.toMatch(/connect-src[^;]*\*;/);
    // script-src: solo orígenes propios + Google Tag Manager (GA4)
    expect(csp).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com"
    );
    // connect-src: solo endpoints de Google Analytics / GA4
    expect(csp).toContain(
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.google.com"
    );
    // frame-src solo permite el embed de YouTube (privacy-enhanced)
    expect(csp).toContain("frame-src https://www.youtube-nocookie.com");
  });

  test("las respuestas de API también llevan cabeceras", async ({ publicApi }) => {
    const res = await publicApi.post("/api/cupones/validar", {
      data: { codigo: "SIN_CODIGO", subtotal: 100 },
    });
    for (const name of ["x-frame-options", "x-content-type-options", "content-security-policy"]) {
      expect(res.headers()[name], `API header ${name}`).toBeDefined();
    }
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("página 404 también lleva cabeceras y no filtra detalle", async ({ publicApi }) => {
    const res = await publicApi.get("/ruta-que-no-existe-xyz");
    expect(res.status()).toBe(404);
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    const body = await res.text();
    expect(body).not.toContain("Internal Server Error");
  });

  test("cabeceras presentes incluso en respuesta 401 (sesión no válida)", async ({ publicApi }) => {
    const res = await publicApi.get("/api/admin/settings");
    expect(res.status()).toBe(401);
    for (const name of ["x-frame-options", "x-content-type-options", "content-security-policy"]) {
      expect(res.headers()[name], `401 header ${name}`).toBeDefined();
    }
  });
});
