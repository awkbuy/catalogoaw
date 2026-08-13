import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

const TEST_EMAIL = `popup-${Date.now()}@example.com`;

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@catalogoapp.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function setSettings(page: Page, data: Record<string, string>) {
  const res = await page.request.put("/api/admin/settings", { data });
  expect(res.status(), `PUT settings falló: ${await res.text()}`).toBe(200);
}

interface OwnEvent {
  eventType: string;
  source?: string;
}

// El tracking propio prefiere navigator.sendBeacon, que Playwright no puede
// interceptar. Al deshabilitarlo, el servicio cae al fallback fetch() y los
// eventos quedan visibles para page.on("request").
function setupTracking(page: Page): OwnEvent[] {
  const events: OwnEvent[] = [];
  void page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, "sendBeacon", {
        value: undefined,
        configurable: true,
      });
    } catch {
      // navegadores sin soporte: el fallback a fetch ya cubre el caso
    }
    window.open = () => null;
  });
  page.on("request", (req) => {
    if (!req.url().includes("/api/analytics/event")) return;
    if (req.method() !== "POST") return;
    const post = req.postData();
    if (!post) return;
    try {
      events.push(JSON.parse(post) as OwnEvent);
    } catch {
      // payload malformado: se ignora
    }
  });
  return events;
}

async function waitForEvent(events: OwnEvent[], eventType: string): Promise<OwnEvent> {
  await expect
    .poll(() => events.some((e) => e.eventType === eventType))
    .toBe(true);
  return events.find((e) => e.eventType === eventType)!;
}

test.describe.serial("Popup de captura de email", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await spoofIp(page);
    await loginAdmin(page);
    await setSettings(page, {
      popupEnabled: "true",
      popupTitle: "Novedades en Wolfie",
      popupText: "Dejanos tu email y recibí ofertas.",
      popupDelaySeconds: "0",
      popupImage: "",
    });
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    // Restaura la config del seed (popup desactivado)
    const page = await browser.newPage();
    await spoofIp(page);
    await loginAdmin(page);
    await setSettings(page, { popupEnabled: "false", popupDelaySeconds: "10" });
    await page.close();
  });

  test("aparece según la config, valida el email, suscribe y registra email_subscribe", async ({
    page,
  }) => {
    await spoofIp(page);
    const events = setupTracking(page);

    await page.goto("/");

    const input = page.getByLabel("Tu email");
    await expect(input).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Dejanos tu email y recibí ofertas.")).toBeVisible();

    // validación del lado cliente: email inválido muestra error
    await input.fill("no-es-un-email");
    await page.getByRole("button", { name: "Suscribirme" }).click();
    await expect(page.getByText("Ingresá un email válido.")).toBeVisible();

    // suscripción válida: estado de éxito + evento propio
    await input.fill(TEST_EMAIL);
    await page.getByRole("button", { name: "Suscribirme" }).click();
    await expect(page.getByRole("heading", { name: "¡Listo!" })).toBeVisible({
      timeout: 10000,
    });
    const evt = await waitForEvent(events, "email_subscribe");
    expect(evt.source).toBe("popup");

    // cooldown semanal: tras suscribirse el popup no reaparece al recargar
    await page.reload();
    await page.waitForTimeout(2500);
    await expect(page.getByLabel("Tu email")).not.toBeVisible();
  });

  test("cooldown semanal: un cooldown reciente (1 hora) oculta el popup", async ({
    page,
  }) => {
    await spoofIp(page);
    await page.addInitScript(() => {
      window.localStorage.setItem("wr_popup_last_shown", String(Date.now() - 60 * 60 * 1000));
    });
    await page.goto("/");
    await page.waitForTimeout(2500);
    await expect(page.getByLabel("Tu email")).not.toBeVisible();
  });

  test("con un cooldown de 8 días el popup vuelve a aparecer", async ({ page }) => {
    await spoofIp(page);
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "wr_popup_last_shown",
        String(Date.now() - 8 * 24 * 60 * 60 * 1000)
      );
    });
    await page.goto("/");
    await expect(page.getByLabel("Tu email")).toBeVisible({ timeout: 15000 });
  });

  test("un email duplicado no rompe la suscripción", async ({ page }) => {
    await spoofIp(page);
    await page.goto("/");
    const input = page.getByLabel("Tu email");
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.fill(TEST_EMAIL);
    await page.getByRole("button", { name: "Suscribirme" }).click();
    await expect(page.getByRole("heading", { name: "¡Listo!" })).toBeVisible({
      timeout: 10000,
    });
  });
});
