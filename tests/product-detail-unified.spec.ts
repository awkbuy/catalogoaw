import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

interface OwnEvent {
  eventType: string;
  [key: string]: unknown;
}

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

async function waitForEvent(events: OwnEvent[], eventType: string): Promise<void> {
  await expect.poll(() => events.some((e) => e.eventType === eventType)).toBe(true);
}

test.describe("Diseño unificado de detalle de producto", () => {
  test("la página de detalle usa el diseño del modal y no tiene Consultar por WhatsApp", async ({
    page,
  }) => {
    await page.goto("/juegos/catan");

    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Comprar" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Agregar al carrito/ })).toBeVisible();
    await expect(page.getByText("Observaciones")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Consultar por WhatsApp/ })
    ).toHaveCount(0);
  });

  test("el modal de la home muestra el mismo diseño con Compartir", async ({ page }) => {
    await spoofIp(page);
    const events = setupTracking(page);
    await page.goto("/");
    await waitForEvent(events, "page_view");

    await page.getByRole("button", { name: "Ver detalle" }).first().click();

    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Agregar al carrito/ })).toBeVisible();
    await expect(page.getByText("Observaciones")).toBeVisible();
  });
});
