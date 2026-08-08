import { test, expect, type Page } from "@playwright/test";
import { spoofIp, randomIp } from "./helpers";

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@wolfieroom.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

// En dev, React hidrata la página un instante después de "domcontentloaded".
// Un click antes de la hidratación se pierde en silencio; el poll reintenta
// hasta que el handler queda activo (idempotente para tabs y rango).
async function clickUntil(page: Page, action: () => Promise<void>, done: () => Promise<boolean>) {
  await expect
    .poll(
      async () => {
        await action();
        return done();
      },
      { timeout: 20_000 }
    )
    .toBe(true);
}

test.describe("Dashboard Marketing", () => {
  // El primer request a /marketing compila el bundle de recharts en dev
  // (máquina local + OneDrive), lo que puede superar el timeout por defecto.
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
    await loginAdmin(page);
  });

  test("el sidebar navega a /marketing y la página carga con tabs y KPIs", async ({ page }) => {
    await page.goto("/marketing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Marketing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "General" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Productos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Categorías" })).toBeVisible();
    await expect(page.getByRole("button", { name: "WhatsApp" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Búsquedas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tráfico" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Integraciones" })).toBeVisible();

    await expect(page.getByTestId("kpi-pageViews")).toBeVisible();
    await expect(page.getByTestId("kpi-productViews")).toBeVisible();
    await expect(page.getByTestId("trend-chart")).toBeVisible();
  });

  test("el selector de rango recarga los datos con los días elegidos", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/admin/marketing/dashboard")) requests.push(req.url());
    });

    await page.goto("/marketing", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("kpi-pageViews")).toBeVisible();

    await clickUntil(
      page,
      () => page.getByTestId("range-7").click(),
      async () =>
        (await page.getByTestId("range-7").getAttribute("aria-pressed")) === "true"
    );
    await expect.poll(() => requests.some((u) => u.includes("days=7"))).toBe(true);

    await clickUntil(
      page,
      () => page.getByTestId("range-90").click(),
      async () =>
        (await page.getByTestId("range-90").getAttribute("aria-pressed")) === "true"
    );
    await expect.poll(() => requests.some((u) => u.includes("days=90"))).toBe(true);
  });

  test("las pestañas muestran productos e integraciones", async ({ page }) => {
    await page.goto("/marketing", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("kpi-pageViews")).toBeVisible();

    await clickUntil(
      page,
      () => page.getByTestId("tab-productos").click(),
      async () => (await page.getByRole("columnheader", { name: "Juego" }).count()) > 0
    );
    await expect(page.getByRole("columnheader", { name: "Vistas" })).toBeVisible();

    await clickUntil(
      page,
      () => page.getByTestId("tab-integraciones").click(),
      async () => (await page.getByTestId("integration-ga4").count()) > 0
    );
    await expect(page.getByTestId("integration-meta-pixel")).toBeVisible();
    await expect(page.getByTestId("integration-meta-capi")).toBeVisible();
    await expect(page.getByTestId("integration-clarity")).toBeVisible();
  });

  test("las pestañas nuevas muestran categorías, WhatsApp, búsquedas y tráfico", async ({ page }) => {
    await page.goto("/marketing", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("kpi-pageViews")).toBeVisible();

    await clickUntil(
      page,
      () => page.getByTestId("tab-categorias").click(),
      async () =>
        (await page.getByText("Vistas, carritos y WhatsApp por categoría").count()) > 0
    );
    await expect(page.getByText("Vistas, carritos y WhatsApp por categoría")).toBeVisible();

    await clickUntil(
      page,
      () => page.getByTestId("tab-whatsapp").click(),
      async () => (await page.getByTestId("whatsapp-stats").count()) > 0
    );
    await expect(page.getByTestId("whatsapp-stats")).toBeVisible();
    await expect(page.getByText("Clics en WhatsApp")).toBeVisible();

    await clickUntil(
      page,
      () => page.getByTestId("tab-busquedas").click(),
      async () => (await page.getByTestId("search-stats").count()) > 0
    );
    await expect(page.getByTestId("search-stats")).toBeVisible();
    await expect(page.getByText("Búsquedas más realizadas")).toBeVisible();
    await expect(page.getByText("Búsquedas sin resultados")).toBeVisible();

    await clickUntil(
      page,
      () => page.getByTestId("tab-trafico").click(),
      async () => (await page.getByTestId("traffic-stats").count()) > 0
    );
    await expect(page.getByTestId("traffic-stats")).toBeVisible();
    await expect(page.getByText("Fuentes de tráfico")).toBeVisible();
    await expect(page.getByText("Vistas de página")).toBeVisible();
  });

  test("los eventos de analytics se reflejan en el dashboard", async ({ page }) => {
    const suffix = Date.now();
    const nombre = `Dash Test ${suffix}`;
    const slug = `dash-test-${suffix}`;

    const catsRes = await page.request.get("/api/admin/categorias");
    expect(catsRes.status()).toBe(200);
    const cats: { id: string }[] = await catsRes.json();
    expect(cats.length).toBeGreaterThan(0);
    const categoriaId = cats[0].id;

    const createRes = await page.request.post("/api/admin/juegos", {
      data: {
        nombre,
        slug,
        descripcion: "Juego creado para testear el dashboard de marketing.",
        categoriaId,
        categoriaIds: [categoriaId],
        jugadoresMin: 2,
        jugadoresMax: 4,
        duracion: "30 min",
        edad: "8+",
        dificultad: "Fácil",
        precioFinalVenta: "$10.000",
        estado: "Disponible",
        destacado: false,
        nuevo: true,
        disponibleVenta: true,
        disponibleMesa: true,
        orden: 999,
      },
    });
    expect(createRes.status(), `Fallo al crear: ${await createRes.text()}`).toBe(200);
    const created = await createRes.json();

    const ip = randomIp();
    const postEvent = (data: Record<string, unknown>) =>
      page.request.post("/api/analytics/event", {
        data,
        headers: { "x-forwarded-for": ip },
      });

    try {
      const beforeRes = await page.request.get("/api/admin/marketing/dashboard?days=30");
      expect(beforeRes.status()).toBe(200);
      const before: { totals: { pageViews: number } } = await beforeRes.json();

      for (let i = 0; i < 3; i++) {
        const ev = await postEvent({
          eventType: "page_view",
          metadata: { clientId: `dash-${suffix}-${i}` },
        });
        expect(ev.status()).toBe(200);
      }
      for (let i = 0; i < 5; i++) {
        const ev = await postEvent({
          eventType: "view_item",
          gameId: created.id,
          gameName: nombre,
          categoryName: "Test",
          metadata: { clientId: `dash-view-${suffix}-${i}` },
        });
        expect(ev.status()).toBe(200);
      }

      const afterRes = await page.request.get("/api/admin/marketing/dashboard?days=30");
      expect(afterRes.status()).toBe(200);
      const after: {
        totals: { pageViews: number; productViews: number };
        products: { gameId: string; totalViews: number }[];
      } = await afterRes.json();

      expect(after.totals.pageViews).toBeGreaterThanOrEqual(before.totals.pageViews + 3);
      expect(after.totals.productViews).toBeGreaterThanOrEqual(5);
      const product = after.products.find((p) => p.gameId === created.id);
      expect(product, "el juego con view_item debería aparecer en el top de productos").toBeTruthy();
      expect(product!.totalViews).toBeGreaterThanOrEqual(5);

      await page.goto("/marketing", { waitUntil: "domcontentloaded" });
      await clickUntil(
        page,
        () => page.getByTestId("tab-productos").click(),
        async () => (await page.getByRole("cell", { name: nombre }).count()) > 0
      );
      await expect(page.getByRole("cell", { name: nombre })).toBeVisible();
    } finally {
      await page.request.delete(`/api/admin/juegos/${created.id}`);
    }
  });
});
