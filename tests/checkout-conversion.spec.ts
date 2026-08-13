import { test, expect, type Page } from "@playwright/test";

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

// En CI el dev server hidrata la home lentamente (bundle enorme en modo dev sobre
// un runner chico). Un click sobre el HTML del SSR antes de que React adjunte los
// listeners se pierde en silencio. El page_view se dispara en un useEffect al
// completarse la hidratación, así que esperarlo garantiza listeners activos.
async function waitForHydration(events: OwnEvent[]): Promise<void> {
  await expect
    .poll(() => events.some((e) => e.eventType === "page_view"))
    .toBe(true);
}

test.describe("Conversión — buy box y panel de compra (Fase 1)", () => {
  test("la ficha muestra el buy box con Comprar, Agregar, condición y medios de pago", async ({
    page,
  }) => {
    await page.goto("/productos/smartwatch-deportivo");

    const buyBox = page.getByRole("complementary");
    await expect(buyBox.getByText(/Nuevo · Vendido por/)).toBeVisible();
    await expect(buyBox.getByRole("button", { name: "Comprar" })).toBeVisible();
    await expect(buyBox.getByRole("button", { name: /Agregar al carrito/ })).toBeVisible();
    await expect(buyBox.getByText("Medios de pago:")).toBeVisible();
  });

  test("Comprar agrega al carrito y abre el checkout", async ({ page }) => {
    await page.goto("/productos/smartwatch-deportivo");

    await page.getByRole("button", { name: "Comprar" }).click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("Agregar al carrito no abre el checkout y el ítem queda guardado", async ({ page }) => {
    await page.goto("/productos/smartwatch-deportivo");

    await page.getByRole("button", { name: /Agregar al carrito/ }).click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toHaveCount(0);

    await page.getByLabel("Abrir carrito").first().click();
    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("el modal muestra Compartir y Agregar en dos columnas", async ({ page }) => {
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);

    await page.locator("article").first().click();

    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Agregar al carrito/ })).toBeVisible();
    await expect(page.getByText("Observaciones")).toBeVisible();
  });

  test("el modal mantiene Compartir y Agregar fijos abajo al scrollear el contenido", async ({
    page,
  }) => {
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);

    await page.locator("article").first().click();

    const contenido = page.locator("div.flex-1.overflow-y-auto");
    await contenido.evaluate((el) => (el.scrollTop = el.scrollHeight));

    await expect(page.getByRole("button", { name: "Compartir" })).toBeInViewport();
    await expect(page.getByRole("button", { name: /Agregar al carrito/ })).toBeInViewport();
  });

  test("modal: Agregar al carrito cierra el modal, no abre el checkout y muestra Ver carrito", async ({
    page,
  }) => {
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);

    await page.locator("article").first().click();
    await page.getByRole("button", { name: /Agregar al carrito/ }).click();

    await expect(page.getByRole("heading", { name: "Detalle del producto" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Carrito" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Ver carrito/ })).toBeVisible();

    await page.getByRole("button", { name: /Ver carrito/ }).click();
    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("modal: Comprar agrega y abre el checkout directo", async ({ page }) => {
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);

    await page.locator("article").first().click();
    await page.locator(".max-w-lg").getByRole("button", { name: "Comprar" }).click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("primera compra: retiro y efectivo vienen preseleccionados", async ({ page }) => {
    await page.goto("/productos/smartwatch-deportivo");

    await page.getByRole("button", { name: "Comprar" }).click();
    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await page.getByPlaceholder("Juan Pérez").fill("Juan Pérez");
    await page.getByPlaceholder("261 123 4567").fill("2611234567");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(
      page.getByRole("radio", { name: /Lo retiro personalmente/ })
    ).toBeChecked();
    await expect(page.getByRole("radio", { name: "Efectivo" })).toBeChecked();
  });

  test("el carrito es un wizard de 3 pasos y mantiene Subtotal y el CTA fijos abajo", async ({
    page,
  }) => {
    await page.goto("/productos/smartwatch-deportivo");

    await page.getByRole("button", { name: "Comprar" }).click();
    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();

    await expect(page.getByText("Paso 1 de 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Hacer pedido" })).toBeVisible();

    await page.getByRole("button", { name: "Hacer pedido" }).click();
    await expect(page.getByText("Paso 2 de 3")).toBeVisible();
    await page.getByPlaceholder("Juan Pérez").fill("Juan Pérez");
    await page.getByPlaceholder("261 123 4567").fill("2611234567");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Paso 3 de 3")).toBeVisible();

    const contenido = page.locator("div.flex-1.overflow-y-auto");
    await contenido.evaluate((el) => (el.scrollTop = el.scrollHeight));

    await expect(page.getByText("Subtotal")).toBeInViewport();
    await expect(
      page.getByRole("button", { name: /Confirmar y pedir por WhatsApp/ })
    ).toBeInViewport();
  });

  test("la card muestra Comprar y al clickearlo agrega y abre el carrito", async ({ page }) => {
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);

    await page.getByRole("button", { name: "Comprar" }).first().click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(1 producto)")).toBeVisible();
  });

  test("el quick add muestra el badge circular volando hacia el carrito", async ({ page }) => {
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);

    await page.locator("article").first().getByRole("button", { name: "Comprar" }).click();

    await expect
      .poll(
        () =>
          page
            .evaluate(() => {
              const el = document.querySelector("[data-fly-to-cart]");
              return el ? getComputedStyle(el).borderRadius : "";
            })
            .catch(() => ""),
        { timeout: 3000, message: "el badge circular no apareció tras el quick add" }
      )
      .toBe("50%");
  });

  test("móvil: la barra sticky agrega con Agregar y abre el carrito con Comprar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/productos/smartwatch-deportivo");

    await page.evaluate(() => window.scrollBy(0, 1200));

    const stickyAgregar = page.getByRole("button", { name: "Agregar" }).first();
    await expect(stickyAgregar).toBeInViewport();
    await stickyAgregar.click();

    await expect(page.getByRole("button", { name: /Ver carrito/ })).toBeVisible();

    const stickyComprar = page.getByRole("button", { name: "Comprar" }).last();
    await stickyComprar.click();

    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
    await expect(page.getByText("(2 productos)")).toBeVisible();
  });

  test("móvil: buy box arriba del pliegue y barra sticky al scrollear", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/productos/smartwatch-deportivo");

    const buyBox = page.getByRole("button", { name: "Comprar" }).first();
    await expect(buyBox).toBeInViewport();

    await page.evaluate(() => window.scrollBy(0, 1200));

    const stickyBar = page.getByRole("button", { name: "Comprar" }).last();
    await expect(stickyBar).toBeInViewport();
  });
});

test.describe("Conversión — cuotas y envío estilo ML (Fase 2)", () => {
  test("la card muestra precio grande, cuotas verdes y envío", async ({ page }) => {
    await page.goto("/");

    const card = page.locator("article").first();
    await expect(card.getByText(/3 cuotas de/)).toBeVisible();
    await expect(card.getByText(/Envío a Envío Mendoza desde/)).toBeVisible();
    await expect(card.getByText(/Retiro gratis/)).toBeVisible();
  });

  test("el buy box muestra cuotas y envío bajo el precio", async ({ page }) => {
    await page.goto("/productos/smartwatch-deportivo");

    const buyBox = page.getByRole("complementary");
    await expect(buyBox.getByText(/3 cuotas de/)).toBeVisible();
    await expect(buyBox.getByText(/Envío a Envío Mendoza desde/)).toBeVisible();
    await expect(buyBox.getByText(/Retiro gratis/)).toBeVisible();
  });

  test("el modal muestra cuotas y envío bajo el precio", async ({ page }) => {
    const events = setupTracking(page);
    await page.goto("/");
    await waitForHydration(events);
    await page.locator("article").first().click();

    const modal = page.locator(".max-w-lg");
    await expect(modal.getByText(/3 cuotas de/).first()).toBeVisible();
    await expect(modal.getByText(/Envío a Envío Mendoza desde/)).toBeVisible();
    await expect(modal.getByText(/Retiro gratis/)).toBeVisible();
  });

  test("zona consultar: la card avisa y el checkout lo pasa como a confirmar", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("admin@catalogoapp.com");
    await page.locator('input[name="password"]').fill("admin123");
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    const zonas = (await (await page.request.get("/api/admin/envios")).json()) as Array<{
      id: string;
      name: string;
      consultar: boolean;
      cost: number;
      freeFrom: number;
      active: boolean;
      order: number;
      [key: string]: unknown;
    }>;
    const nacional = zonas.find((z) => z.name === "Envío Nacional");
    if (!nacional) return;
    const payload = (consultar: boolean) => ({
      name: nacional.name,
      cost: nacional.cost,
      freeFrom: nacional.freeFrom,
      active: nacional.active,
      order: nacional.order,
      consultar,
    });

    try {
      const put = await page.request.put(`/api/admin/envios/${nacional.id}`, {
        data: payload(true),
      });
      expect(put.status()).toBe(200);

      await page.addInitScript(() => {
        (window as unknown as { __wrWaUrl: string }).__wrWaUrl = "";
        window.open = (url?: string | URL) => {
          (window as unknown as { __wrWaUrl: string }).__wrWaUrl = String(url || "");
          return null;
        };
      });
      const events = setupTracking(page);
      await page.goto("/");
      await waitForHydration(events);

      const card = page.locator("article").first();
      await expect(
        card.getByText(/Envío a Envío Nacional: consultar monto/)
      ).toBeVisible();

      await card.getByRole("button", { name: "Comprar" }).click();
      await page.getByRole("button", { name: "Hacer pedido" }).click();
      await page.getByPlaceholder("Juan Pérez").fill("Juan Pérez");
      await page.getByPlaceholder("261 123 4567").fill("2611234567");
      await page.getByRole("button", { name: "Continuar" }).click();

      await page.getByRole("radio", { name: /Necesito que me lo envíen/ }).check();
      await expect(page.getByText(/Envío a confirmar por WhatsApp/)).toBeVisible();
      await page.getByRole("radio", { name: /Envío Nacional/ }).check();
      await page.getByPlaceholder("Calle y número").fill("Av. San Martín 1234");
      await page.getByPlaceholder("Ciudad / Localidad").fill("Córdoba");
      await page.getByPlaceholder("Provincia").fill("Córdoba");
      await page.getByPlaceholder("Código postal").fill("5000");
      await page.getByRole("radio", { name: "Efectivo" }).check();

      await expect(page.getByText(/^A confirmar$/)).toBeVisible();
      await expect(page.getByText(/se confirma por WhatsApp/)).toBeVisible();

      await page.getByRole("button", { name: /Confirmar y pedir por WhatsApp/ }).click();
      const url = await page.evaluate(
        () => (window as unknown as { __wrWaUrl: string }).__wrWaUrl
      );
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("Envío (Envío Nacional): consultar monto");
      expect(decoded).toContain("(envío a confirmar)");
    } finally {
      await page.request.put(`/api/admin/envios/${nacional.id}`, {
        data: payload(false),
      });
    }
  });
});
