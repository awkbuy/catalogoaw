import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

const GAME_ID = "cmsg69pvo0007s0cl1te2fewi";
const GAME_NAME = "Catan";
const CATEGORY_ID = "cmsg69pro0001s0clpiu8w7jf";
const CATEGORY_NAME = "Estrategia";

async function postEvent(page: Page, body: Record<string, unknown>) {
  return page.request.post("/api/analytics/event", {
    data: body,
  });
}

test.describe("Analytics propio (POST /api/analytics/event)", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
  });

  test("evento válido responde { ok: true }", async ({ page }) => {
    const res = await postEvent(page, {
      eventType: "view_item",
      gameId: GAME_ID,
      gameName: GAME_NAME,
      categoryId: CATEGORY_ID,
      categoryName: CATEGORY_NAME,
      price: 50000,
      source: "catalog_card",
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  test("eventType inválido → 400 con mensaje genérico", async ({ page }) => {
    const res = await postEvent(page, {
      eventType: "no_existe_este_evento",
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Evento no válido" });
  });

  test("eventType faltante → 400", async ({ page }) => {
    const res = await postEvent(page, {
      gameId: GAME_ID,
      gameName: GAME_NAME,
    });
    expect(res.status()).toBe(400);
  });

  test("JSON mal formado → 400, sin stack trace", async ({ page }) => {
    const res = await page.request.post("/api/analytics/event", {
      data: "{esto no es json",
      headers: { "content-type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const text = await res.text();
    expect(text).not.toMatch(/PrismaClient|node_modules|at\s+\w+\.\w+\(/);
  });

  test("precio string se acepta y se normaliza", async ({ page }) => {
    const res = await postEvent(page, {
      eventType: "add_to_cart",
      gameId: GAME_ID,
      gameName: GAME_NAME,
      price: "45000.5",
    });
    expect(res.status()).toBe(200);
  });

  test("search se registra con searchTerm", async ({ page }) => {
    const res = await postEvent(page, {
      eventType: "search",
      searchTerm: "catan",
      source: "catalog",
    });
    expect(res.status()).toBe(200);
  });
});
