import { test, expect, randomIp, assertNoLeak, readBody } from "./fixtures";

const VALID_EVENT = {
  eventType: "view_item",
  productId: "cmsg69pvo0007s0cl1te2fewi",
  productName: "Smartwatch Deportivo",
  categoryId: "cmsg69pro0001s0clpiu8w7jf",
  categoryName: "Tecnología",
};

test.describe("11 · API Analytics — validación, abuso y no-filtración", () => {
  test("eventType no whitelisted → 400 genérico, sin stack trace", async ({ publicApi }) => {
    const res = await publicApi.post("/api/analytics/event", {
      data: { ...VALID_EVENT, eventType: "hack_attempt" },
    });
    expect(res.status()).toBe(400);
    const body = await readBody(res);
    expect(body).toContain("Evento no válido");
    assertNoLeak(body, "eventType inválido");
  });

  test("payloads XSS/SQLi en campos → 400 o 200, nunca un error interno ni filtración", async ({ publicApi }) => {
    const payloads = [
      `<script>alert(1)</script>`,
      `' OR '1'='1`,
      `'; DROP TABLE AnalyticsEvent;--`,
      `<img src=x onerror=alert(1)>`,
    ];
    for (const payload of payloads) {
      const res = await publicApi.post("/api/analytics/event", {
        data: {
          ...VALID_EVENT,
          productName: payload,
          categoryName: payload,
          searchTerm: payload,
        },
      });
      expect([200, 400]).toContain(res.status());
      const body = await readBody(res);
      assertNoLeak(body, `payload ${payload}`);
    }
  });

  test("campos excesivamente largos se truncan (sin crash, sin filtración)", async ({ publicApi }) => {
    const res = await publicApi.post("/api/analytics/event", {
      data: {
        ...VALID_EVENT,
        productName: "A".repeat(50_000),
        source: "B".repeat(50_000),
      },
    });
    expect(res.status()).toBe(200);
    const body = await readBody(res);
    assertNoLeak(body, "campos largos");
  });

  test("JSON mal formado → 400 genérico, sin filtración", async ({ publicApi }) => {
    const res = await publicApi.post("/api/analytics/event", {
      data: "{no soy json",
      headers: { "content-type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const body = await readBody(res);
    assertNoLeak(body, "JSON mal formado analytics");
  });

  test("rate limit: 60 eventos por IP → el 61º recibe 429", async ({ publicApi }) => {
    const ip = randomIp();
    const headers = { "x-forwarded-for": ip };
    for (let i = 0; i < 60; i++) {
      const res = await publicApi.post("/api/analytics/event", {
        data: { ...VALID_EVENT, productId: `${VALID_EVENT.productId}${i}` },
        headers,
      });
      expect(res.status(), `evento ${i + 1} permitido`).toBe(200);
    }
    const blocked = await publicApi.post("/api/analytics/event", {
      data: VALID_EVENT,
      headers,
    });
    expect(blocked.status()).toBe(429);
    const body = await readBody(blocked);
    expect(body).toContain("Demasiados eventos");
    assertNoLeak(body, "429 analytics");
  });

  test("el bloqueo es por IP: otra IP sigue operando", async ({ publicApi }) => {
    const res = await publicApi.post("/api/analytics/event", {
      data: VALID_EVENT,
      headers: { "x-forwarded-for": randomIp() },
    });
    expect(res.status()).toBe(200);
  });
});
