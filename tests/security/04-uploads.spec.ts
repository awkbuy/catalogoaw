import { test, expect, assertNoLeak, readBody } from "./fixtures";

const ENDPOINT = "/api/admin/upload";

test.describe("04 · Uploads — archivos maliciosos rechazados", () => {
  const cases: { label: string; name: string; mimeType: string; content: Buffer | string }[] = [
    { label: ".exe", name: "virus.exe", mimeType: "application/octet-stream", content: "MZ\u0000\u0001.exe payload" },
    { label: ".php", name: "shell.php", mimeType: "application/x-httpd-php", content: "<?php system($_GET['c']); ?>" },
    { label: ".js", name: "script.js", mimeType: "text/javascript", content: "fetch('https://evil.example')" },
    {
      label: "SVG con JavaScript",
      name: "xss.svg",
      mimeType: "image/svg+xml",
      content:
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><image href="x" onerror="alert(2)"/></svg>',
    },
    { label: "HTML", name: "page.html", mimeType: "text/html", content: "<html><script>alert(1)</script></html>" },
  ];

  for (const c of cases) {
    test(`rechaza ${c.label} (${c.name})`, async ({ adminApi }) => {
      const res = await adminApi.post(ENDPOINT, {
        multipart: {
          file: { name: c.name, mimeType: c.mimeType, buffer: Buffer.from(c.content) },
        },
      });
      expect(res.status()).toBe(400);
      const body = await readBody(res);
      assertNoLeak(body, `upload ${c.label}`);
    });
  }

  test("rechaza archivo mayor al límite (10MB)", async ({ adminApi }) => {
    const big = Buffer.alloc(11 * 1024 * 1024, 0x61);
    const res = await adminApi.post(ENDPOINT, {
      multipart: {
        file: { name: "grande.jpg", mimeType: "image/jpeg", buffer: big },
      },
    });
    expect(res.status()).toBe(400);
    const body = await readBody(res);
    assertNoLeak(body, "upload tamaño");
  });

  test("rechaza MIME incorrecto aunque el nombre sea .jpg", async ({ adminApi }) => {
    const res = await adminApi.post(ENDPOINT, {
      multipart: {
        file: {
          name: "malicioso.jpg",
          mimeType: "text/javascript",
          buffer: Buffer.from("alert('xss')"),
        },
      },
    });
    expect(res.status()).toBe(400);
  });

  test("rechaza MIME falseado (image/jpeg pero contenido ejecutable)", async ({ adminApi }) => {
    const res = await adminApi.post(ENDPOINT, {
      multipart: {
        file: {
          name: "spoof.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("<script>alert(1)</script>"),
        },
      },
    });
    expect([400]).toContain(res.status());
    const body = await readBody(res);
    assertNoLeak(body, "upload MIME falseado");
  });

  test("rechaza imagen corrupta (no es una imagen real)", async ({ adminApi }) => {
    const res = await adminApi.post(ENDPOINT, {
      multipart: {
        file: {
          name: "corrupt.png",
          mimeType: "image/png",
          buffer: Buffer.from("esto no es una png real, solo basura aleatoria"),
        },
      },
    });
    expect([400]).toContain(res.status());
    const body = await readBody(res);
    assertNoLeak(body, "upload corrupta");
  });

  test("acepta una imagen real y la sirve como WebP (regresión: bytes nulos en la cabecera)", async ({ adminApi }) => {
    const sharp = (await import("sharp")).default;
    const png = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 120, g: 80, b: 200 } },
    })
      .png()
      .toBuffer();

    const res = await adminApi.post(ENDPOINT, {
      multipart: {
        file: { name: "real.png", mimeType: "image/png", buffer: png },
      },
    });
    expect(res.status()).toBe(200);

    const body = await readBody(res);
    const url = (() => {
      try {
        return JSON.parse(body).url;
      } catch {
        return "";
      }
    })() as string;
    expect(url.startsWith("/uploads/")).toBe(true);

    const served = await adminApi.get(url);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-type"]).toBe("image/webp");
  });

  test("subida sin sesión → 401", async ({ publicApi }) => {
    const res = await publicApi.post(ENDPOINT, {
      multipart: {
        file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("abc") },
      },
    });
    expect(res.status()).toBe(401);
  });
});
