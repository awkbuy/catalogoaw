import { test, expect, spoofIp, randomIp } from "./fixtures";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./fixtures";

test.describe("03 · Cookies — atributos de seguridad", () => {
  test("la cookie de sesión es HttpOnly, Secure, SameSite=Lax y expira en 7 días", async ({ page }) => {
    await spoofIp(page, randomIp());
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name === "session_token");
    expect(session).toBeDefined();
    expect(session!.httpOnly).toBe(true);
    expect(session!.secure).toBe(true);
    expect(session!.sameSite).toBe("Lax");
    expect(session!.path).toBe("/");
    expect(session!.expires).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(session!.expires - Math.floor(Date.now() / 1000)).toBeGreaterThan(6 * 86400);

    // HttpOnly: no accesible desde JS
    const docCookie = await page.evaluate(() => document.cookie);
    expect(docCookie).not.toContain("session_token");
  });

  test("reutilizar cookie inválida → 401", async ({ page, publicApi }) => {
    const res = await publicApi.get("/api/admin/settings", {
      headers: { cookie: "session_token=cookie-invalida" },
    });
    expect(res.status()).toBe(401);

    const res2 = await publicApi.get("/api/admin/settings", {
      headers: { cookie: "session_token=id-cualquiera.firma-falsa" },
    });
    expect(res2.status()).toBe(401);
  });

  test("cookie con firma manipulada → 401 (integridad de la sesión)", async ({ publicApi }) => {
    // token con la firma alterada no debe ser aceptado
    const res = await publicApi.get("/api/admin/settings", {
      headers: {
        cookie: `session_token=id-real${"a".repeat(63)}.${"0".repeat(64)}`,
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.text();
    expect(body).toContain("Unauthorized");
  });
});
