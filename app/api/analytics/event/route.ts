import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isAnalyticsEventType } from "@/lib/analytics";

const MAX_STRING_LEN = 200;
const MAX_UTM_LEN = 100;

function sanitizeString(value: unknown, maxLen = MAX_STRING_LEN): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeUtm(value: unknown): string | undefined {
  return sanitizeString(value, MAX_UTM_LEN);
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

function dayKey(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function bumpDailyMetrics(date: Date, patch: Record<string, number>) {
  const base = dayKey(date);
  const existing = await prisma.dailyMetrics.findUnique({ where: { date: base } });
  const increments: Record<string, { increment: number }> = {};
  for (const [key, value] of Object.entries(patch)) {
    increments[key] = { increment: value };
  }
  if (existing) {
    return prisma.dailyMetrics.update({
      where: { date: base },
      data: { ...increments, updatedAt: new Date() },
    });
  }
  return prisma.dailyMetrics.create({
    data: { date: base, ...patch },
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitResult = rateLimit(`analytics:${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 60,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Demasiados eventos. Intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const eventType = sanitizeString(body.eventType);
  if (!eventType || !isAnalyticsEventType(eventType)) {
    return NextResponse.json({ error: "Evento no válido" }, { status: 400 });
  }

  const gameId = sanitizeString(body.gameId);
  const gameName = sanitizeString(body.gameName);
  const categoryId = sanitizeString(body.categoryId);
  const categoryName = sanitizeString(body.categoryName);
  const searchTerm = sanitizeString(body.searchTerm, 100);
  const source = sanitizeString(body.source, 50);
  const price = sanitizePrice(body.price);

  const utm =
    body.utm && typeof body.utm === "object" && !Array.isArray(body.utm)
      ? {
          source: sanitizeUtm(body.utm.source),
          medium: sanitizeUtm(body.utm.medium),
          campaign: sanitizeUtm(body.utm.campaign),
          content: sanitizeUtm(body.utm.content),
          term: sanitizeUtm(body.utm.term),
        }
      : null;

  let metadata: string | undefined;
  if (body.metadata && typeof body.metadata === "object") {
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body.metadata)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        safe[k] = v;
      }
    }
    metadata = Object.keys(safe).length > 0 ? JSON.stringify(safe) : undefined;
  } else if (typeof body.metadata === "string") {
    metadata = body.metadata.slice(0, 500);
  }

  let clientId: string | undefined;
  let sessionId: string | undefined;
  let device: string | undefined;
  let browser: string | undefined;
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata);
      if (typeof parsed.clientId === "string") clientId = parsed.clientId;
      if (typeof parsed.sessionId === "string") sessionId = parsed.sessionId;
      if (typeof parsed.device === "string") device = parsed.device;
      if (typeof parsed.browser === "string") browser = parsed.browser;
    } catch {
      // metadata no es JSON válido; se ignora para métricas agregadas
    }
  }

  const dailyPatch: Record<string, number> = {};
  if (eventType === "page_view") dailyPatch.pageViews = 1;
  if (eventType === "view_item") dailyPatch.productViews = 1;
  if (eventType === "add_to_cart") dailyPatch.cartAdditions = 1;
  if (eventType === "whatsapp_click") dailyPatch.whatsappClicks = 1;
  if (eventType === "search") dailyPatch.searches = 1;
  if (eventType === "begin_checkout") dailyPatch.checkouts = 1;

  if (Object.keys(dailyPatch).length > 0) {
    if (clientId) {
      const alreadyTracked = await prisma.analyticsEvent.findFirst({
        where: {
          createdAt: { gte: dayKey(new Date()) },
          metadata: { contains: clientId },
        },
      });
      if (!alreadyTracked) dailyPatch.uniqueVisitors = 1;
    }
    if (sessionId) {
      const alreadyTracked = await prisma.analyticsEvent.findFirst({
        where: {
          createdAt: { gte: dayKey(new Date()) },
          metadata: { contains: sessionId },
        },
      });
      if (!alreadyTracked) dailyPatch.sessions = 1;
    }
    await bumpDailyMetrics(new Date(), dailyPatch);
  }

  await prisma.analyticsEvent.create({
    data: {
      eventType,
      gameId,
      gameName,
      categoryId,
      categoryName,
      searchTerm,
      source,
      price,
      metadata,
      utmSource: utm?.source,
      utmMedium: utm?.medium,
      utmCampaign: utm?.campaign,
      utmContent: utm?.content,
      utmTerm: utm?.term,
    },
  });

  if (gameId && gameName) {
    const productPatch: Record<string, unknown> = { gameName };
    if (categoryName) productPatch.categoryName = categoryName;
    if (eventType === "view_item") {
      productPatch.totalViews = { increment: 1 };
      productPatch.lastViewedAt = new Date();
    }
    if (eventType === "add_to_cart") productPatch.totalCartAdds = { increment: 1 };
    if (eventType === "whatsapp_click") productPatch.totalWhatsapp = { increment: 1 };
    if (eventType === "begin_checkout") productPatch.totalCheckouts = { increment: 1 };

    const existingProduct = await prisma.productMetrics.findUnique({ where: { gameId } });
    if (existingProduct) {
      await prisma.productMetrics.update({
        where: { gameId },
        data: { ...productPatch, updatedAt: new Date() },
      });
    } else {
      await prisma.productMetrics.create({
        data: {
          gameId,
          gameName,
          categoryName,
          totalViews: eventType === "view_item" ? 1 : 0,
          totalCartAdds: eventType === "add_to_cart" ? 1 : 0,
          totalWhatsapp: eventType === "whatsapp_click" ? 1 : 0,
          totalCheckouts: eventType === "begin_checkout" ? 1 : 0,
          lastViewedAt: eventType === "view_item" ? new Date() : null,
        },
      });
    }
  }

  if (categoryId && categoryName) {
    const categoryPatch: Record<string, unknown> = { categoryName };
    if (eventType === "view_item") categoryPatch.totalViews = { increment: 1 };
    if (eventType === "add_to_cart") categoryPatch.totalCartAdds = { increment: 1 };
    if (eventType === "whatsapp_click") categoryPatch.totalWhatsapp = { increment: 1 };

    const existingCategory = await prisma.categoryMetrics.findUnique({ where: { categoryId } });
    if (existingCategory) {
      await prisma.categoryMetrics.update({
        where: { categoryId },
        data: { ...categoryPatch, updatedAt: new Date() },
      });
    } else {
      await prisma.categoryMetrics.create({
        data: {
          categoryId,
          categoryName,
          totalViews: eventType === "view_item" ? 1 : 0,
          totalCartAdds: eventType === "add_to_cart" ? 1 : 0,
          totalWhatsapp: eventType === "whatsapp_click" ? 1 : 0,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
