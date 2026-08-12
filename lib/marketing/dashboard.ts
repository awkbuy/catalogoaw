import { Prisma } from "@prisma/client";
import { getTenantDb } from "@/lib/tenant";

export interface MarketingTotals {
  uniqueVisitors: number;
  sessions: number;
  pageViews: number;
  productViews: number;
  cartAdditions: number;
  whatsappClicks: number;
  searches: number;
  checkouts: number;
}

export interface MarketingTrendPoint {
  date: string;
  uniqueVisitors: number;
  sessions: number;
  pageViews: number;
  productViews: number;
  cartAdditions: number;
  whatsappClicks: number;
  searches: number;
  checkouts: number;
}

export interface MarketingProductRow {
  gameId: string;
  gameName: string;
  categoryName: string | null;
  totalViews: number;
  totalCartAdds: number;
  totalWhatsapp: number;
  totalCheckouts: number;
  lastViewedAt: string | null;
}

export interface MarketingCategoryRow {
  categoryId: string;
  categoryName: string;
  totalViews: number;
  totalCartAdds: number;
  totalWhatsapp: number;
}

export interface MarketingWhatsAppTopProduct {
  gameId: string;
  gameName: string;
  totalWhatsapp: number;
}

export interface MarketingWhatsAppByCategory {
  categoryName: string;
  totalViews: number;
  totalWhatsapp: number;
  conversionRate: number;
}

export interface MarketingHourlyPoint {
  hour: number;
  count: number;
}

export interface MarketingWhatsAppStats {
  totalClicks: number;
  topProducts: MarketingWhatsAppTopProduct[];
  byCategory: MarketingWhatsAppByCategory[];
  hourly: MarketingHourlyPoint[];
}

export interface MarketingSearchTermStat {
  searchTerm: string;
  count: number;
}

export interface MarketingSearchStats {
  topTerms: MarketingSearchTermStat[];
  noResults: MarketingSearchTermStat[];
}

export interface MarketingTrafficItem {
  label: string;
  count: number;
}

export interface MarketingTrafficStats {
  sources: MarketingTrafficItem[];
  mediums: MarketingTrafficItem[];
  campaigns: MarketingTrafficItem[];
  devices: MarketingTrafficItem[];
  browsers: MarketingTrafficItem[];
  totalPageViews: number;
}

export interface MarketingIntegration {
  id: string;
  name: string;
  enabled: boolean;
  configured: boolean;
  detail: string;
}

export interface MarketingDashboardData {
  days: number;
  rangeStart: string;
  rangeEnd: string;
  totals: MarketingTotals;
  trend: MarketingTrendPoint[];
  products: MarketingProductRow[];
  categories: MarketingCategoryRow[];
  whatsapp: MarketingWhatsAppStats;
  search: MarketingSearchStats;
  traffic: MarketingTrafficStats;
  integrations: MarketingIntegration[];
}

export const MARKETING_DAYS_OPTIONS = [7, 30, 90] as const;
export type MarketingDaysOption = (typeof MARKETING_DAYS_OPTIONS)[number];

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function emptyTotals(): MarketingTotals {
  return {
    uniqueVisitors: 0,
    sessions: 0,
    pageViews: 0,
    productViews: 0,
    cartAdditions: 0,
    whatsappClicks: 0,
    searches: 0,
    checkouts: 0,
  };
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true";
}

const MAX_EVENT_ROWS = 5000;
const MAX_TRAFFIC_ITEMS = 10;

function parseMetadataDeviceBrowser(raw: string | null): {
  device?: string;
  browser?: string;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      device: typeof parsed.device === "string" ? parsed.device : undefined,
      browser: typeof parsed.browser === "string" ? parsed.browser : undefined,
    };
  } catch {
    return {};
  }
}

export async function getMarketingDashboard(days: number): Promise<MarketingDashboardData> {
  const prisma = await getTenantDb();
  const safeDays = (MARKETING_DAYS_OPTIONS as readonly number[]).includes(days)
    ? days
    : 30;

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (safeDays - 1));
  start.setHours(0, 0, 0, 0);
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);

  const [gameRows, dailyRows, categoryRows, settingRows, hourlyRows] = await Promise.all([
    prisma.game.findMany({ select: { id: true } }),
    prisma.dailyMetrics.findMany({ where: { date: { gte: dayStart } } }),
    prisma.categoryMetrics.findMany({ orderBy: { totalViews: "desc" }, take: 10 }),
    prisma.setting.findMany(),
    prisma.$queryRaw<Array<{ hour: number; count: number }>>(Prisma.sql`
      SELECT CAST(strftime('%H', "createdAt") AS INTEGER) AS hour, COUNT(*) AS count
      FROM "AnalyticsEvent"
      WHERE "eventType" = 'whatsapp_click'
        AND "createdAt" >= ${start}
        AND "createdAt" <= ${end}
      GROUP BY hour
      ORDER BY hour ASC
    `),
  ]);

  const existingGameIds = gameRows.map((g) => g.id);
  const liveProductMetrics = (orderBy: Prisma.ProductMetricsOrderByWithRelationInput) =>
    prisma.productMetrics.findMany({
      where: { gameId: { in: existingGameIds } },
      orderBy,
      take: 10,
    });

  const [productRows, whatsappTop] = await Promise.all([
    liveProductMetrics({ totalViews: "desc" }),
    liveProductMetrics({ totalWhatsapp: "desc" }),
  ]);

  const s: Record<string, string> = {};
  for (const row of settingRows) {
    s[row.key] = row.value;
  }
  const ga4Enabled = toBool(s.ga4Enabled, true);
  const metaPixelEnabled = toBool(s.metaPixelEnabled, false);
  const metaCapiEnabled = toBool(s.metaCapiEnabled, false);
  const clarityEnabled = toBool(s.clarityEnabled, false);
  const ga4MeasurementId = s.ga4MeasurementId || "";
  const metaPixelId = s.metaPixelId || "";
  const clarityProjectId = s.clarityProjectId || "";

  const byDate = new Map<string, typeof dailyRows[number]>();
  for (const row of dailyRows) {
    byDate.set(dayKey(row.date), row);
  }

  const totals = emptyTotals();
  const trend: MarketingTrendPoint[] = [];
  for (let i = 0; i < safeDays; i++) {
    const d = new Date(dayStart);
    d.setDate(dayStart.getDate() + i);
    const key = dayKey(d);
    const row = byDate.get(key);
    const point: MarketingTrendPoint = {
      date: key,
      uniqueVisitors: row?.uniqueVisitors ?? 0,
      sessions: row?.sessions ?? 0,
      pageViews: row?.pageViews ?? 0,
      productViews: row?.productViews ?? 0,
      cartAdditions: row?.cartAdditions ?? 0,
      whatsappClicks: row?.whatsappClicks ?? 0,
      searches: row?.searches ?? 0,
      checkouts: row?.checkouts ?? 0,
    };
    trend.push(point);
    totals.uniqueVisitors += point.uniqueVisitors;
    totals.sessions += point.sessions;
    totals.pageViews += point.pageViews;
    totals.productViews += point.productViews;
    totals.cartAdditions += point.cartAdditions;
    totals.whatsappClicks += point.whatsappClicks;
    totals.searches += point.searches;
    totals.checkouts += point.checkouts;
  }

  const [searchRows, trafficRows] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        eventType: "search",
        searchTerm: { not: null },
        createdAt: { gte: start, lte: end },
      },
      select: { searchTerm: true, metadata: true },
      orderBy: { createdAt: "desc" },
      take: MAX_EVENT_ROWS,
    }),
    prisma.analyticsEvent.findMany({
      where: { eventType: "page_view", createdAt: { gte: start, lte: end } },
      select: { metadata: true },
      orderBy: { createdAt: "desc" },
      take: MAX_EVENT_ROWS,
    }),
  ]);

  const termCounts = new Map<string, { count: number; noResults: number }>();
  for (const row of searchRows) {
    const term = row.searchTerm?.trim() || "";
    if (!term) continue;
    const entry = termCounts.get(term) || { count: 0, noResults: 0 };
    entry.count += 1;
    if (row.metadata) {
      try {
        const meta = JSON.parse(row.metadata) as { resultsCount?: unknown };
        if (meta.resultsCount === 0) entry.noResults += 1;
      } catch {
        // metadata no es JSON válido; se ignora
      }
    }
    termCounts.set(term, entry);
  }
  const topTerms = Array.from(termCounts.entries())
    .map(([searchTerm, { count }]) => ({ searchTerm, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const noResults = Array.from(termCounts.entries())
    .filter(([, { noResults }]) => noResults > 0)
    .map(([searchTerm, { noResults: count }]) => ({ searchTerm, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const deviceCounts = new Map<string, number>();
  const browserCounts = new Map<string, number>();
  for (const row of trafficRows) {
    const { device, browser } = parseMetadataDeviceBrowser(row.metadata);
    if (device) deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
    if (browser) browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);
  }
  const toItems = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_TRAFFIC_ITEMS);

  const [utmSourceRows, utmMediumRows, utmCampaignRows, totalPageViews] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["utmSource"],
      where: {
        eventType: "page_view",
        utmSource: { not: null },
        createdAt: { gte: start, lte: end },
      },
      _count: { _all: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: MAX_TRAFFIC_ITEMS,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["utmMedium"],
      where: {
        eventType: "page_view",
        utmMedium: { not: null },
        createdAt: { gte: start, lte: end },
      },
      _count: { _all: true },
      orderBy: { _count: { utmMedium: "desc" } },
      take: MAX_TRAFFIC_ITEMS,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["utmCampaign"],
      where: {
        eventType: "page_view",
        utmCampaign: { not: null },
        createdAt: { gte: start, lte: end },
      },
      _count: { _all: true },
      orderBy: { _count: { utmCampaign: "desc" } },
      take: MAX_TRAFFIC_ITEMS,
    }),
    prisma.analyticsEvent.count({
      where: { eventType: "page_view", createdAt: { gte: start, lte: end } },
    }),
  ]);

  const utmSourceTotal = utmSourceRows.reduce((acc, r) => acc + r._count._all, 0);
  const directVisits = Math.max(0, totalPageViews - utmSourceTotal);
  const sources = [
    ...utmSourceRows.map((r) => ({ label: r.utmSource || "", count: r._count._all })),
    ...(directVisits > 0 ? [{ label: "(directo)", count: directVisits }] : []),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TRAFFIC_ITEMS);

  const whatsappByCategory = categoryRows
    .map((c) => ({
      categoryName: c.categoryName,
      totalViews: c.totalViews,
      totalWhatsapp: c.totalWhatsapp,
      conversionRate:
        c.totalViews > 0 ? Number(((c.totalWhatsapp / c.totalViews) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalWhatsapp - a.totalWhatsapp)
    .filter((c) => c.totalWhatsapp > 0 || c.totalViews > 0);

  const tokenConfigured = Boolean(process.env.META_ACCESS_TOKEN);

  return {
    days: safeDays,
    rangeStart: dayStart.toISOString(),
    rangeEnd: end.toISOString(),
    totals,
    trend,
    products: productRows.map((p) => ({
      gameId: p.gameId,
      gameName: p.gameName,
      categoryName: p.categoryName,
      totalViews: p.totalViews,
      totalCartAdds: p.totalCartAdds,
      totalWhatsapp: p.totalWhatsapp,
      totalCheckouts: p.totalCheckouts,
      lastViewedAt: p.lastViewedAt ? p.lastViewedAt.toISOString() : null,
    })),
    categories: categoryRows.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      totalViews: c.totalViews,
      totalCartAdds: c.totalCartAdds,
      totalWhatsapp: c.totalWhatsapp,
    })),
    whatsapp: {
      totalClicks: totals.whatsappClicks,
      topProducts: whatsappTop.map((p) => ({
        gameId: p.gameId,
        gameName: p.gameName,
        totalWhatsapp: p.totalWhatsapp,
      })),
      byCategory: whatsappByCategory,
      hourly: hourlyRows.map((r) => ({ hour: Number(r.hour), count: Number(r.count) })),
    },
    search: { topTerms, noResults },
    traffic: {
      sources,
      mediums: utmMediumRows.map((r) => ({
        label: r.utmMedium || "",
        count: r._count._all,
      })),
      campaigns: utmCampaignRows.map((r) => ({
        label: r.utmCampaign || "",
        count: r._count._all,
      })),
      devices: toItems(deviceCounts),
      browsers: toItems(browserCounts),
      totalPageViews,
    },
    integrations: [
      {
        id: "ga4",
        name: "Google Analytics 4",
        enabled: ga4Enabled,
        configured: Boolean(ga4MeasurementId),
        detail: ga4MeasurementId || "Sin Measurement ID",
      },
      {
        id: "meta-pixel",
        name: "Meta Pixel",
        enabled: metaPixelEnabled,
        configured: Boolean(metaPixelId),
        detail: metaPixelId || "Sin Pixel ID",
      },
      {
        id: "meta-capi",
        name: "Conversions API (Meta)",
        enabled: metaCapiEnabled,
        configured: tokenConfigured,
        detail: tokenConfigured ? "Token de acceso presente" : "Token de acceso ausente",
      },
      {
        id: "clarity",
        name: "Microsoft Clarity",
        enabled: clarityEnabled,
        configured: Boolean(clarityProjectId),
        detail: clarityProjectId || "Sin Project ID",
      },
    ],
  };
}
