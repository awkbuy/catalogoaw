import { test, expect, assertNoLeak } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";

const XSS_NAME = `<script>alert("feed")</script>`;
const XSS_DESC = `<img src=x onerror=alert(1)>, producto;' OR '1'='1`;

async function getCategoriaId(api: APIRequestContext): Promise<string> {
  const res = await api.get("/api/admin/juegos");
  const juegos = await res.json();
  return juegos[0].categoriaId;
}

async function createFeedGame(
  api: APIRequestContext,
  overrides: Record<string, unknown> = {}
): Promise<{ id: string; slug: string }> {
  const categoriaId = await getCategoriaId(api);
  const slug = `feed-sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const res = await api.post("/api/admin/juegos", {
    data: {
      nombre: XSS_NAME,
      slug,
      descripcion: XSS_DESC,
      categoriaId,
      showInMerchant: true,
      showInMetaCommerce: true,
      disponibleVenta: true,
      precioFinalVenta: "25000",
      brand: `<b>&amp;</b>`,
      gtin: `'; DROP TABLE Game;--`,
      googleProductCategory: "Toys & Games",
      ...overrides,
    },
  });
  expect(res.status()).toBe(200);
  return res.json() as Promise<{ id: string; slug: string }>;
}

function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

test.describe("14 · Feeds — escape de payloads, headers y no-filtración", () => {
  test("XML de Google/Meta escapa payloads XSS (nunca raw <script>)", async ({ adminApi, publicApi }) => {
    const game = await createFeedGame(adminApi);
    try {
      for (const path of ["/api/feeds/google/xml", "/api/feeds/meta/xml"]) {
        const res = await publicApi.get(path);
        expect(res.status()).toBe(200);
        expect(res.headers()["content-type"]).toContain("application/xml");
        const xml = await res.text();

        expect(xml).not.toContain("<script>alert");
        expect(xml).not.toContain("<img src=x");
        expect(xml).toContain("&lt;script&gt;alert(&quot;feed&quot;)&lt;/script&gt;");
        expect(xml).toContain("&apos;; DROP TABLE Game;--");
        expect(xml).toContain("Toys &amp; Games");
        expect(xml).toContain(`<g:id>${game.id}</g:id>`);
      }
    } finally {
      await adminApi.delete(`/api/admin/juegos/${game.id}`);
    }
  });

  test("CSV de Meta escapa comillas y separadores sin romper columnas", async ({ adminApi, publicApi }) => {
    const game = await createFeedGame(adminApi, {
      descripcion: `texto, con "comillas"`,
    });
    try {
      const res = await publicApi.get("/api/feeds/meta/csv");
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("text/csv");
      const csv = await res.text();

      expect(csv).toContain(`"texto, con ""comillas"""`);
      const row = csv.split("\n").find((l) => l.startsWith(`${game.id},`));
      expect(row).toBeTruthy();
      const fields = parseCsvRow(row!);
      expect(fields).toHaveLength(13);
      expect(fields[1]).toBe(XSS_NAME);
      expect(fields[2]).toBe(`texto, con "comillas"`);
      assertNoLeak(csv, "CSV feeds");
    } finally {
      await adminApi.delete(`/api/admin/juegos/${game.id}`);
    }
  });

  test("products/json devuelve JSON válido sin inyectar HTML en los campos", async ({ adminApi, publicApi }) => {
    const game = await createFeedGame(adminApi);
    try {
      const res = await publicApi.get("/api/feeds/products/json");
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("application/json");
      const json = await res.json();

      expect(Array.isArray(json)).toBe(true);
      const item = json.find((g: { id: string }) => g.id === game.id);
      expect(item).toBeTruthy();
      expect(item.nombre).toBe(XSS_NAME);
      assertNoLeak(JSON.stringify(json), "JSON feeds");
    } finally {
      await adminApi.delete(`/api/admin/juegos/${game.id}`);
    }
  });

  test("juego no opt-in no se filtra en ningún feed", async ({ adminApi, publicApi }) => {
    const categoriaId = await getCategoriaId(adminApi);
    const slug = `feed-sec-noopt-${Date.now()}`;
    const res = await adminApi.post("/api/admin/juegos", {
      data: {
        nombre: "No Opt-In Secret",
        slug,
        descripcion: "contenido confidencial",
        categoriaId,
        showInMerchant: false,
        showInMetaCommerce: false,
      },
    });
    expect(res.status()).toBe(200);
    const created = (await res.json()) as { id: string };
    try {
      for (const path of [
        "/api/feeds/google/xml",
        "/api/feeds/meta/xml",
        "/api/feeds/meta/csv",
        "/api/feeds/products/json",
      ]) {
        const feedRes = await publicApi.get(path);
        expect(feedRes.status(), path).toBe(200);
        const body = await feedRes.text();
        expect(body, `${path}: no filtra el juego no opt-in`).not.toContain(created.id);
        expect(body, `${path}: no filtra datos del juego no opt-in`).not.toContain("contenido confidencial");
      }
    } finally {
      await adminApi.delete(`/api/admin/juegos/${created.id}`);
    }
  });
});
