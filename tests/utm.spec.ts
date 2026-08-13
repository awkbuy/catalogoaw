import { test, expect, type Page } from "@playwright/test";
import { prisma } from "../lib/prisma";
import { spoofIp } from "./helpers";

const GAME_ID = "cmsg69pvo0007s0cl1te2fewi";

async function postEvent(page: Page, body: Record<string, unknown>) {
  return page.request.post("/api/analytics/event", {
    data: body,
  });
}

async function waitForEvent(
  where: Record<string, unknown>,
  timeout = 10_000
): Promise<unknown> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const row = await prisma.analyticsEvent.findFirst({
      where: where as never,
      orderBy: { createdAt: "desc" },
    });
    if (row) return row;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("el evento no llegó a la base a tiempo");
}

test.describe("UTM tracking", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
  });

  test("la API persiste UTM en el evento", async ({ page }) => {
    const marker = `utm-test-${Date.now()}`;
    const res = await postEvent(page, {
      eventType: "view_item",
      productId: GAME_ID,
      productName: "Smartwatch Deportivo",
      source: marker,
      utm: {
        source: "facebook",
        medium: "cpc",
        campaign: "lanzamiento",
        content: "banner-a",
        term: "smartwatch",
      },
    });
    expect(res.status()).toBe(200);

    const row = (await waitForEvent({ source: marker })) as {
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      utmContent: string | null;
      utmTerm: string | null;
    };
    expect(row.utmSource).toBe("facebook");
    expect(row.utmMedium).toBe("cpc");
    expect(row.utmCampaign).toBe("lanzamiento");
    expect(row.utmContent).toBe("banner-a");
    expect(row.utmTerm).toBe("smartwatch");
  });

  test("evento sin UTM persiste con campos null", async ({ page }) => {
    const marker = `utm-none-${Date.now()}`;
    const res = await postEvent(page, {
      eventType: "page_view",
      source: marker,
    });
    expect(res.status()).toBe(200);

    const row = (await waitForEvent({ source: marker })) as {
      utmSource: string | null;
      utmMedium: string | null;
    };
    expect(row.utmSource).toBeNull();
    expect(row.utmMedium).toBeNull();
  });

  test("valores UTM no-string se ignoran y los válidos se conservan", async ({ page }) => {
    const marker = `utm-bad-${Date.now()}`;
    const res = await postEvent(page, {
      eventType: "add_to_cart",
      productId: GAME_ID,
      productName: "Smartwatch Deportivo",
      source: marker,
      utm: {
        source: 123,
        campaign: ["array"],
        medium: "cpc",
      },
    });
    expect(res.status()).toBe(200);

    const row = (await waitForEvent({ source: marker })) as {
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
    };
    expect(row.utmSource).toBeNull();
    expect(row.utmCampaign).toBeNull();
    expect(row.utmMedium).toBe("cpc");
  });

  test("UTM de la URL de entrada se captura y se adjunta a eventos posteriores", async ({
    page,
  }) => {
    await page.goto("/?utm_source=facebook&utm_medium=cpc&utm_campaign=launch");
    await page.waitForLoadState("networkidle");

    const pageView = (await waitForEvent({
      utmSource: "facebook",
      eventType: "page_view",
      source: { startsWith: "/" },
    })) as { utmCampaign: string | null };
    expect(pageView.utmCampaign).toBe("launch");

    await page.goto("/productos/smartwatch-deportivo");
    await page.waitForTimeout(1500);

    const viewItem = await waitForEvent({
      utmSource: "facebook",
      eventType: "view_item",
    });
    expect(viewItem).toBeTruthy();
  });
});
