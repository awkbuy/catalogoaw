import { test, expect, spoofIp, randomIp, assertNoLeak, readBody } from "./fixtures";
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PATH } from "./fixtures";

test.describe("09 · Rate limiting — fuerza bruta y abuso mitigados", () => {
  test("validación de cupones: 10 intentos por IP → el 11º recibe 429", async ({ publicApi }) => {
    const ip = randomIp();
    const headers = { "x-forwarded-for": ip };
    for (let i = 0; i < 10; i++) {
      const res = await publicApi.post("/api/cupones/validar", {
        data: { codigo: `NOEXISTE${i}`, subtotal: 100 },
        headers,
      });
      expect(res.status(), `intento ${i + 1} permitido`).toBe(400);
    }
    const blocked = await publicApi.post("/api/cupones/validar", {
      data: { codigo: "NOEXISTE11", subtotal: 100 },
      headers,
    });
    expect(blocked.status()).toBe(429);
    const body = await readBody(blocked);
    expect(body).toContain("Demasiados intentos");
    assertNoLeak(body, "429 cupones");
  });

  test("el bloqueo es por IP: otra IP no se ve afectada", async ({ publicApi }) => {
    // IP nueva → lejos del límite, sigue operando (400 cupón no válido, no 429)
    const other = await publicApi.post("/api/cupones/validar", {
      data: { codigo: "NOEXISTE-OTRA", subtotal: 100 },
      headers: { "x-forwarded-for": randomIp() },
    });
    expect(other.status()).toBe(400);
    const body = await readBody(other);
    expect(body).toContain("Cupón no válido");
  });

  test("login: tras 5 fallos, la contraseña correcta también queda bloqueada", async ({ page }) => {
    const ip = randomIp();
    await spoofIp(page, ip);
    await page.goto(`/${ADMIN_PATH}/login`);
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/Email/i).fill(ADMIN_EMAIL);
      await page.locator('input[name="password"]').fill("wrong-password");
      await page.getByRole("button", { name: /Iniciar sesión/i }).click();
      await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10_000 });
    }
    // 6º intento: contraseña CORRECTA pero el rate limit lo bloquea igual
    await page.getByLabel(/Email/i).fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();
    await expect(page.getByText(/Demasiados intentos/i)).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain("/login");
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "session_token")).toBe(false);
  });

  test("login con IP limpia sí funciona (no hay bloqueo global)", async ({ page }) => {
    await spoofIp(page, randomIp());
    await page.goto(`/${ADMIN_PATH}/login`);
    await page.getByLabel(/Email/i).fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});
