import { test, expect, randomIp } from "./fixtures";
import { ADMIN_PATH } from "./fixtures";

test.describe("10 · Carga — el servidor no se cae bajo ráfagas de ataque", () => {
  test("ráfaga de 40 requests públicos concurrentes → todos 200", async ({ publicApi }) => {
    const results = await Promise.all(
      Array.from({ length: 40 }, () => publicApi.get("/"))
    );
    for (const r of results) {
      expect(r.status()).toBe(200);
    }
  });

  test("ráfaga concurrente a /api/cupones/validar con IPs distintas → ningún 500", async ({ publicApi }) => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        publicApi.post("/api/cupones/validar", {
          data: { codigo: `BURST${i}`, subtotal: 100 },
          headers: { "x-forwarded-for": randomIp() },
        })
      )
    );
    for (const r of results) {
      expect(r.status()).not.toBe(500);
      expect([400, 429]).toContain(r.status());
    }
  });

  test("tras las ráfagas el servidor sigue estable (login y admin OK)", async ({ page, adminApi }) => {
    // la sesión admin sigue válida
    const res = await adminApi.get("/api/admin/juegos");
    expect(res.status()).toBe(200);

    // la página pública sigue cargando
    await page.goto(`/${ADMIN_PATH}/login`);
    await expect(page.getByRole("heading", { name: /Admin Panel/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
  });
});
