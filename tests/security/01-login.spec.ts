import { test, expect, spoofIp, randomIp, assertNoLeak } from "./fixtures";
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PATH } from "./fixtures";

async function goToLogin(page: import("@playwright/test").Page) {
  await page.goto(`/${ADMIN_PATH}/login`);
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
}

async function submitLogin(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.getByLabel(/Email/i).fill(email);
  await page.locator('input[name="password"]').fill(password);
  // El campo es type=email: sin esto, payloads no-email (SQLi/XSS) no se envían
  // porque el navegador bloquea la validación HTML5. Lo forzamos a text.
  await page.evaluate(() => {
    document.querySelector('input[name="email"]')?.setAttribute("type", "text");
  });
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
}

test.describe("01 · Login — comportamiento de ataque", () => {
  test("credenciales válidas redirigen al dashboard", async ({ page }) => {
    await spoofIp(page, randomIp());
    await goToLogin(page);
    await submitLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "session_token")).toBe(true);
  });

  test("contraseña incorrecta → error genérico, sin sesión", async ({ page }) => {
    await spoofIp(page, randomIp());
    await goToLogin(page);
    await submitLogin(page, ADMIN_EMAIL, "wrong-password");
    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain("/login");
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "session_token")).toBe(false);
  });

  test("usuario inexistente → mismo mensaje genérico (sin enumeración de usuarios)", async ({ page }) => {
    await spoofIp(page, randomIp());
    await goToLogin(page);
    await submitLogin(page, "noexiste@example.com", "password123");
    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10_000 });
    // innerText excluye el valor de los inputs (el email tipeado queda en el campo)
    const bodyText = await page.evaluate(() => document.body.innerText);
    assertNoLeak(bodyText, "login usuario inexistente");
    expect(bodyText).not.toContain("noexiste@example.com");
  });

  test("SQL Injection en email no autentica ni filtra SQL", async ({ page }) => {
    await spoofIp(page, randomIp());
    await goToLogin(page);
    for (const payload of [
      "' OR 1=1 --",
      "' UNION SELECT * FROM User --",
      "admin'--",
      "admin@wolfieroom.com' OR '1'='1",
    ]) {
      await submitLogin(page, payload, "x");
      await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10_000 });
      expect(page.url()).toContain("/login");
    }
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "session_token")).toBe(false);
    const bodyText = await page.evaluate(() => document.body.innerText);
    assertNoLeak(bodyText, "login SQLi");
    expect(bodyText).not.toContain("Syntax error");
  });

  test("XSS en credenciales → error genérico, sin ejecución", async ({ page }) => {
    await spoofIp(page, randomIp());
    await goToLogin(page);
    let executed = false;
    page.on("dialog", async (d) => {
      executed = true;
      await d.dismiss();
    });
    await submitLogin(
      page,
      `<script>window.__xss=1</script>@example.com`,
      `"><img src=x onerror="window.__xss=2">`
    );
    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10_000 });
    const xss = await page.evaluate(
      () => (window as unknown as { __xss?: unknown }).__xss ?? null
    );
    expect(xss).toBeNull();
    expect(executed).toBe(false);
  });

  test("contraseñas extremadamente largas → error genérico, sin crash", async ({ page }) => {
    await spoofIp(page, randomIp());
    await goToLogin(page);
    await submitLogin(page, ADMIN_EMAIL, "A".repeat(100_000));
    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10_000 });
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "session_token")).toBe(false);
  });

  test("campos vacíos → mensaje de requerimiento", async ({ page }) => {
    await spoofIp(page, randomIp());
    await goToLogin(page);
    // el form usa `required` del navegador: lo removemos para forzar el envío.
    await page.evaluate(() => {
      document.querySelectorAll("input[required]").forEach((i) => i.removeAttribute("required"));
    });
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();
    await expect(page.getByText(/Email y contraseña son requeridos/i)).toBeVisible({ timeout: 10_000 });
  });

  test("caracteres Unicode → error genérico, sin crash", async ({ page }) => {
    await spoofIp(page, randomIp());
    await goToLogin(page);
    await submitLogin(page, `admin@wolfieroom.com`, `🙈🙉🙊😈👾日本語`);
    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10_000 });
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "session_token")).toBe(false);
  });

  test("fuerza bruta → rate limiting bloquea intentos extra", async ({ page }) => {
    const ip = randomIp();
    await spoofIp(page, ip);
    await goToLogin(page);

    for (let i = 0; i < 5; i++) {
      await submitLogin(page, ADMIN_EMAIL, "wrong-password");
      await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 10_000 });
    }

    // 6º intento dentro de la ventana → bloqueado por rate limit
    await submitLogin(page, ADMIN_EMAIL, "wrong-password");
    await expect(page.getByText(/Demasiados intentos/i)).toBeVisible({ timeout: 10_000 });
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "session_token")).toBe(false);
  });
});
