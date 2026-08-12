import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getMarketingConfig } from "@/lib/marketing/settings";
import { sendMetaCapiEvent } from "@/lib/marketing/capi";

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "ViewCategory",
  "AddToCart",
  "RemoveFromCart",
  "ViewCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "ClickWhatsApp",
  "Share",
  "EmailSubscribe",
]);

const MAX_STRING_LEN = 200;
const MAX_URL_LEN = 500;

function sanitizeString(value: unknown, maxLen = MAX_STRING_LEN): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeEventSourceUrl(value: unknown): string | undefined {
  const url = sanitizeString(value, MAX_URL_LEN);
  if (!url) return undefined;
  if (!/^https?:\/\//i.test(url)) return undefined;
  return url;
}

function sanitizePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitResult = rateLimit(`marketing-capi:${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 30,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Demasiados eventos. Intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

  const config = await getMarketingConfig();
  if (!config.metaCapiEnabled || !config.metaPixelId) {
    return NextResponse.json({ ok: true });
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => ({}));

  const eventName = sanitizeString(body.event);
  if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ error: "Evento no válido" }, { status: 400 });
  }

  const eventId = sanitizeString(body.event_id, 64);
  if (!eventId) {
    return NextResponse.json({ error: "event_id requerido" }, { status: 400 });
  }

  const rawData = body.data && typeof body.data === "object" ? body.data : {};

  const contentIds = Array.isArray(rawData.content_ids)
    ? rawData.content_ids
        .filter((v: unknown): v is string => typeof v === "string")
        .slice(0, 10)
        .map((v: string) => v.trim().slice(0, 100))
        .filter(Boolean)
    : undefined;

  const customData = {
    content_ids: contentIds,
    content_type: sanitizeString(rawData.content_type, 50),
    content_name: sanitizeString(rawData.content_name),
    content_category: sanitizeString(rawData.content_category, 100),
    value: sanitizePrice(rawData.value),
    currency:
      typeof rawData.currency === "string"
        ? rawData.currency.toUpperCase().slice(0, 3)
        : undefined,
    quantity:
      typeof rawData.quantity === "number" && Number.isFinite(rawData.quantity) && rawData.quantity > 0
        ? Math.floor(rawData.quantity)
        : undefined,
    search_string: sanitizeString(rawData.search_term, 100),
    source: sanitizeString(rawData.source, 50),
  };

  const userAgent = req.headers.get("user-agent") || undefined;
  const origin = req.headers.get("origin") || undefined;
  const eventSourceUrl = sanitizeEventSourceUrl(body.event_source_url) || origin;

  try {
    await sendMetaCapiEvent(
      { event: eventName, event_id: eventId, data: customData },
      {
        pixelId: config.metaPixelId,
        accessToken,
        testEventCode: config.metaTestEventCode || undefined,
        userAgent,
        eventSourceUrl,
      }
    );
  } catch {
    // silencio: nunca exponer errores internos de la integración
  }

  return NextResponse.json({ ok: true });
}
