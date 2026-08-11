import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

interface OwnEvent {
  eventType: string;
  [key: string]: unknown;
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

// En CI el dev server hidrata la home lentamente (bundle enorme en modo dev sobre
// un runner chico). Un click sobre el HTML del SSR antes de que React adjunte los
// listeners se pierde en silencio. El page_view se dispara en un useEffect al
// completarse la hidratación, así que esperarlo garantiza listeners activos.
async function waitForHydration(events: OwnEvent[]): Promise<void> {
  await waitForEvent(events, "page_view");
}

// El quick-add existe en tarjetas de juegos disponibles para la compra
// (botón único "Comprar" full-width estilo ML).
async function clickQuickAdd(page: Page): Promise<void> {
  const cards = page.locator("article");
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const buy = card.getByRole("button", { name: "Comprar" });
    if ((await buy.count()) === 1) {
      await buy.click();
      return;
    }
  }
  throw new Error("No se encontró una tarjeta con botón de compra rápida");
}

test.describe("Marketing Core — eventos disparados por la UI", () => {
  test("home dispara page_view propio", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    const evt = await waitForEvent(events, "page_view");
    expect(evt.source).toBeTruthy();
  });

  test("la página de detalle de un juego dispara view_item", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/juegos/catan");
    const evt = await waitForEvent(events, "view_item");
    expect(evt.gameName).toBe("Catan");
    expect(evt.gameId).toBeTruthy();
  });

  test("click en Compartir del detalle dispara share", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/juegos/catan");
    await page.getByRole("button", { name: "Compartir" }).click();
    const evt = await waitForEvent(events, "share");
    expect(evt.gameId).toBeTruthy();
    expect(evt.gameName).toBe("Catan");
  });

  test("abrir detalle desde la tarjeta dispara view_item", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);
    await page.locator("article").first().click();
    const evt = await waitForEvent(events, "view_item");
    expect(evt.gameId).toBeTruthy();
  });

  test("quick add dispara add_to_cart", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);
    await clickQuickAdd(page);
    const evt = await waitForEvent(events, "add_to_cart");
    expect(evt.gameId).toBeTruthy();
    expect(evt.source).toBe("catalog_quick_add");
  });

  test("búsqueda debounced dispara search", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);
    await page.getByPlaceholder("Buscar juego...").fill("Catan");
    const evt = await waitForEvent(events, "search");
    expect(evt.searchTerm).toBe("Catan");
  });

  test("click en una categoría del hero dispara filter (ViewCategory)", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);
    const heroSection = page.locator("section").filter({ hasText: "Explorá por categoría" });
    await heroSection.getByRole("button").first().click();
    const evt = await waitForEvent(events, "filter");
    expect(evt.categoryName).toBeTruthy();
  });

  test("abrir el carrito dispara view_cart y eliminar dispara remove_from_cart", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);
    await clickQuickAdd(page);
    await page.getByLabel("Abrir carrito").first().click();
    await waitForEvent(events, "view_cart");
    await page.getByLabel(/Quitar .* del carrito/).first().click();
    const evt = await waitForEvent(events, "remove_from_cart");
    expect(evt.gameId).toBeTruthy();
  });

  test("checkout por WhatsApp dispara begin_checkout, add_payment_info y whatsapp_click", async ({
    page,
  }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);
    await clickQuickAdd(page);
    await page.getByLabel("Abrir carrito").first().click();

    await page.getByRole("button", { name: "Hacer pedido" }).click();
    const begin = await waitForEvent(events, "begin_checkout");
    expect(begin.price).toBeGreaterThan(0);

    await page.getByPlaceholder("Juan Pérez").fill("Juan Pérez");
    await page.getByPlaceholder("261 123 4567").fill("2611234567");
    await page.getByRole("button", { name: "Continuar" }).click();
    const api = await waitForEvent(events, "add_payment_info");
    expect(api.price).toBeGreaterThan(0);

    await page.getByRole("radio", { name: "Lo retiro personalmente" }).check();
    await page.getByRole("radio", { name: "Efectivo" }).check();
    await page.getByRole("button", { name: /Confirmar y pedir por WhatsApp/ }).click();
    const wa = await waitForEvent(events, "whatsapp_click");
    expect(wa.source).toBe("cart_drawer");
  });

  test("pedido con envío por zona arma el mensaje de WhatsApp con zona, costo y total", async ({
    page,
  }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.addInitScript(() => {
      (window as unknown as { __wrWaUrl: string }).__wrWaUrl = "";
      window.open = (url?: string | URL) => {
        (window as unknown as { __wrWaUrl: string }).__wrWaUrl = String(url || "");
        return null;
      };
    });
    await page.goto("/");
    await waitForHydration(events);
    await clickQuickAdd(page);
    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await page.getByPlaceholder("Juan Pérez").fill("Juan Pérez");
    await page.getByPlaceholder("261 123 4567").fill("2611234567");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("radio", { name: /Necesito que me lo envíen/ }).check();
    await page.getByRole("radio", { name: /Envío Mendoza/ }).check();
    await page.getByPlaceholder("Calle y número").fill("Av. San Martín 1234");
    await page.getByPlaceholder("Ciudad / Localidad").fill("Mendoza");
    await page.getByPlaceholder("Provincia").fill("Mendoza");
    await page.getByPlaceholder("Código postal").fill("5500");
    await page.getByRole("radio", { name: "Efectivo" }).check();
    await page.getByRole("button", { name: /Confirmar y pedir por WhatsApp/ }).click();

    const url = await page.evaluate(
      () => (window as unknown as { __wrWaUrl: string }).__wrWaUrl
    );
    expect(url).toContain("https://wa.me/");
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("Envío Mendoza");
    expect(decoded).toContain("Envío");
    expect(decoded).toContain("*Total:");
  });

  test("click en WhatsApp del dock dispara whatsapp_click", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);
    await page.getByRole("button", { name: "WhatsApp" }).click();
    const evt = await waitForEvent(events, "whatsapp_click");
    expect(evt.source).toBe("dock_whatsapp");
  });
});
