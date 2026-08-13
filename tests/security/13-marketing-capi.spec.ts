import { test, expect, randomIp, assertNoLeak, readBody } from "./fixtures";

test.describe("13 · Marketing CAPI — rate limit, robustez y no-filtración", () => {
  test("rate limit: 30 eventos por IP → el 31º recibe 429", async ({ publicApi }) => {
    const ip = randomIp();
    const headers = { "x-forwarded-for": ip };
    for (let i = 0; i < 30; i++) {
      const res = await publicApi.post("/api/marketing/capi", {
        data: {
          event: "ViewContent",
          event_id: `evt-rate-${i}`,
          data: {
            content_ids: ["cmsg69pvo0007s0cl1te2fewi"],
            content_name: "Smartwatch Deportivo",
            value: 50000,
            currency: "ARS",
          },
        },
        headers,
      });
      expect(res.status(), `evento ${i + 1} permitido`).toBe(200);
    }
    const blocked = await publicApi.post("/api/marketing/capi", {
      data: { event: "ViewContent", event_id: "evt-blocked-31", data: {} },
      headers,
    });
    expect(blocked.status()).toBe(429);
    const body = await readBody(blocked);
    expect(body).toContain("Demasiados eventos");
    assertNoLeak(body, "429 CAPI");
  });

  test("el bloqueo es por IP: otra IP sigue operando", async ({ publicApi }) => {
    const res = await publicApi.post("/api/marketing/capi", {
      data: {
        event: "PageView",
        event_id: `evt-otra-${Date.now()}`,
        data: {},
      },
      headers: { "x-forwarded-for": randomIp() },
    });
    expect(res.status()).toBe(200);
  });

  test("JSON mal formado y eventos desconocidos nunca filtran internals", async ({ publicApi }) => {
    const headers = { "x-forwarded-for": randomIp() };

    const badJson = await publicApi.post("/api/marketing/capi", {
      data: "{esto no es json",
      headers: { ...headers, "content-type": "application/json" },
    });
    const badBody = await readBody(badJson);
    assertNoLeak(badBody, "CAPI JSON mal formado");

    const unknownEvent = await publicApi.post("/api/marketing/capi", {
      data: {
        event: "EventoQueNoExiste",
        event_id: "evt-desconocido",
        data: { content_ids: ["<script>alert(1)</script>"] },
      },
      headers,
    });
    expect([200, 400]).toContain(unknownEvent.status());
    const unknownBody = await readBody(unknownEvent);
    assertNoLeak(unknownBody, "CAPI evento desconocido");
  });
});
