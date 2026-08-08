import { test, expect, randomIp, assertNoLeak, readBody } from "./fixtures";

const VALID_EVENT = {
  eventType: "view_item",
  gameId: "cmsg69pvo0007s0cl1te2fewi",
  gameName: "Catan",
  categoryId: "cmsg69pro0001s0clpiu8w7jf",
  categoryName: "Estrategia",
};

test.describe("17 · UTM — validación, truncado y no-filtración", () => {
  test("payloads XSS/SQLi en campos utm → 200, sin filtración", async ({ publicApi }) => {
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
          utm: {
            source: payload,
            medium: payload,
            campaign: payload,
            content: payload,
            term: payload,
          },
        },
        headers: { "x-forwarded-for": randomIp() },
      });
      expect(res.status()).toBe(200);
      const body = await readBody(res);
      assertNoLeak(body, `payload utm ${payload}`);
    }
  });

  test("valores utm excesivamente largos se truncan (sin crash, sin filtración)", async ({
    publicApi,
  }) => {
    const res = await publicApi.post("/api/analytics/event", {
      data: {
        ...VALID_EVENT,
        utm: {
          source: "A".repeat(50_000),
          campaign: "B".repeat(50_000),
        },
      },
      headers: { "x-forwarded-for": randomIp() },
    });
    expect(res.status()).toBe(200);
    const body = await readBody(res);
    assertNoLeak(body, "utm largos");
  });

  test("valores utm no-string o utm malformado se ignoran", async ({ publicApi }) => {
    const cases: Record<string, unknown>[] = [
      { source: 123, medium: ["a"], campaign: { x: 1 } },
      { term: true },
    ];
    for (const utm of cases) {
      const res = await publicApi.post("/api/analytics/event", {
        data: { ...VALID_EVENT, utm },
        headers: { "x-forwarded-for": randomIp() },
      });
      expect(res.status()).toBe(200);
      const body = await readBody(res);
      assertNoLeak(body, "utm no-string");
    }

    for (const utm of ["texto", ["a", "b"], 42]) {
      const res = await publicApi.post("/api/analytics/event", {
        data: { ...VALID_EVENT, utm },
        headers: { "x-forwarded-for": randomIp() },
      });
      expect(res.status()).toBe(200);
      const body = await readBody(res);
      assertNoLeak(body, "utm malformado");
    }
  });

  test("event_source_url de CAPI con payloads no filtra ni rompe", async ({ publicApi }) => {
    const payloads = [
      `"><script>alert(1)</script>`,
      `javascript:alert(1)`,
      `'; DROP TABLE AnalyticsEvent;--`,
      `https://x.com/<script>alert(1)</script>`,
    ];
    for (const url of payloads) {
      const res = await publicApi.post("/api/marketing/capi", {
        data: {
          event: "PageView",
          event_id: `utm-capi-${Date.now()}-${Math.random()}`,
          event_source_url: url,
        },
        headers: { "x-forwarded-for": randomIp() },
      });
      expect([200, 400]).toContain(res.status());
      const body = await readBody(res);
      assertNoLeak(body, `event_source_url ${url}`);
    }
  });
});
