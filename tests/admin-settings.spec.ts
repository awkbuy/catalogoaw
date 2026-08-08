import { test, expect, type Page } from "@playwright/test";
import { spoofIp } from "./helpers";

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill("admin@wolfieroom.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: /Iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

function mockSettings(page: Page, settings: Record<string, string>) {
  return page.route("**/api/admin/settings", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: settings });
    } else {
      await route.continue();
    }
  });
}

const EMPTY: Record<string, string> = {
  ga4Enabled: "false",
  ga4MeasurementId: "",
  ga4PropertyId: "",
  ga4ServiceAccountEmail: "",
  metaPixelEnabled: "false",
  metaPixelId: "",
  metaCapiEnabled: "false",
  metaTestEventCode: "",
  metaBusinessId: "",
  metaCatalogId: "",
  clarityEnabled: "false",
  clarityProjectId: "",
  metaAccessTokenConfigured: "false",
};

const FULL: Record<string, string> = {
  ga4Enabled: "true",
  ga4MeasurementId: "G-9HBTQN02YJ",
  ga4PropertyId: "548805609",
  ga4ServiceAccountEmail: "service@x.iam.gserviceaccount.com",
  metaPixelEnabled: "true",
  metaPixelId: "123456789012345",
  metaCapiEnabled: "true",
  metaTestEventCode: "TEST123",
  metaBusinessId: "999",
  metaCatalogId: "888",
  clarityEnabled: "true",
  clarityProjectId: "abcdefghij",
  metaAccessTokenConfigured: "true",
};

test.describe("Badges de configuración (Configurado)", () => {
  test.beforeEach(async ({ page }) => {
    await spoofIp(page);
    await loginAdmin(page);
  });

  test("sin configuración no muestra badges", async ({ page }) => {
    await mockSettings(page, EMPTY);
    await page.goto("/settings");
    await expect(page.getByTestId("configured-badge")).toHaveCount(0);
  });

  test("con integraciones configuradas muestra un badge por campo", async ({ page }) => {
    await mockSettings(page, FULL);
    await page.goto("/settings");
    // GA4 (4) + Meta (7: pixel toggle, pixel id, capi toggle, token, test code, business id, catalog id) + Clarity (2)
    await expect(page.getByTestId("configured-badge")).toHaveCount(13);
    await expect(page.getByText("Configurado")).toHaveCount(12);
    await expect(page.getByText("Token presente")).toBeVisible();
  });

  test("cuando el token de acceso está presente muestra badge propio", async ({ page }) => {
    await mockSettings(page, {
      ...EMPTY,
      metaCapiEnabled: "true",
      metaAccessTokenConfigured: "true",
    });
    await page.goto("/settings");
    await expect(page.getByText("Token presente")).toBeVisible();
    await expect(page.getByTestId("configured-badge")).toHaveCount(2);
  });
});
