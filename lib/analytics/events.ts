import type { AnalyticsEventType } from "@/lib/analytics";
import { captureUTMParams, getUTMParams, type UtmParams } from "./utm";

export interface AnalyticsMetadata {
  clientId?: string;
  sessionId?: string;
  device?: string;
  browser?: string;
  resultsCount?: number;
}

export interface TrackViewItemParams {
  gameId: string;
  gameName: string;
  categoryId?: string;
  categoryName?: string;
  price?: number;
  source?: string;
}

export interface TrackAddToCartParams {
  gameId: string;
  gameName: string;
  categoryId?: string;
  categoryName?: string;
  price?: number;
  source?: string;
}

export interface TrackRemoveFromCartParams {
  gameId: string;
  gameName: string;
  price?: number;
  source?: string;
}

export interface TrackSearchParams {
  searchTerm: string;
  resultsCount?: number;
  source?: string;
}

export interface TrackWhatsAppParams {
  source: string;
  gameId?: string;
  gameName?: string;
  categoryId?: string;
  categoryName?: string;
}

export interface TrackPageViewParams {
  path: string;
}

export interface TrackBeginCheckoutParams {
  total: number;
  itemsCount: number;
  gameId?: string;
  gameName?: string;
  source?: string;
}

export interface TrackViewCartParams {
  itemsCount: number;
  source?: string;
}

export interface TrackAddPaymentInfoParams {
  total: number;
  itemsCount: number;
  gameId?: string;
  gameName?: string;
  source?: string;
}

export interface TrackShareParams {
  gameId?: string;
  gameName?: string;
  categoryId?: string;
  categoryName?: string;
  source?: string;
}

interface EventPayload {
  eventType: AnalyticsEventType;
  gameId?: string;
  gameName?: string;
  categoryId?: string;
  categoryName?: string;
  searchTerm?: string;
  source?: string;
  price?: number;
  metadata?: AnalyticsMetadata;
  utm?: UtmParams;
}

const SESSION_STORAGE_KEY = "wr_analytics_meta";

function getStoredMeta(): AnalyticsMetadata {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AnalyticsMetadata;
  } catch {
    // ignore malformed storage
  }
  return {};
}

function buildMetadata(extra?: AnalyticsMetadata): AnalyticsMetadata {
  const stored = getStoredMeta();
  const device = detectDevice();
  const browser = detectBrowser();

  let clientId = stored.clientId;
  let sessionId = stored.sessionId;

  if (!clientId) {
    clientId = generateId();
  }
  if (!sessionId) {
    sessionId = generateId();
  }

  const meta = { ...stored, clientId, sessionId, device, browser, ...extra };
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(meta));
    }
  } catch {
    // storage lleno o bloqueado; el tracking sigue funcionando
  }
  return meta;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function detectDevice(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent;
  if (/android/i.test(ua)) return "mobile";
  if (/iPad|iPhone|iPod/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent;
  if (/edg\//i.test(ua)) return "edge";
  if (/firefox\//i.test(ua)) return "firefox";
  if (/chrome|crios\//i.test(ua)) return "chrome";
  if (/safari\//i.test(ua)) return "safari";
  return "other";
}

const lastSentByType = new Map<string, number>();

function throttle(type: string): boolean {
  const now = Date.now();
  const last = lastSentByType.get(type) || 0;
  if (now - last < 1000) return false;
  lastSentByType.set(type, now);
  return true;
}

function send(payload: EventPayload): void {
  if (typeof window === "undefined") return;
  if (!throttle(payload.eventType)) return;

  const utm = { ...getUTMParams(), ...captureUTMParams() };

  const body = JSON.stringify({
    ...payload,
    metadata: buildMetadata(payload.metadata),
    utm: Object.keys(utm).length > 0 ? utm : undefined,
  });

  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics/event", blob)) return;
    }
  } catch {
    // sendBeacon no disponible; se intenta fetch
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // silencio: el tracking nunca debe romper la UX
  });
}

export function trackViewItem(params: TrackViewItemParams): void {
  send({
    eventType: "view_item",
    gameId: params.gameId,
    gameName: params.gameName,
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    price: params.price,
    source: params.source,
  });
}

export function trackAddToCart(params: TrackAddToCartParams): void {
  send({
    eventType: "add_to_cart",
    gameId: params.gameId,
    gameName: params.gameName,
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    price: params.price,
    source: params.source,
  });
}

export function trackRemoveFromCart(params: TrackRemoveFromCartParams): void {
  send({
    eventType: "remove_from_cart",
    gameId: params.gameId,
    gameName: params.gameName,
    price: params.price,
    source: params.source,
  });
}

export function trackSearch(params: TrackSearchParams): void {
  send({
    eventType: "search",
    searchTerm: params.searchTerm,
    source: params.source,
    metadata:
      params.resultsCount !== undefined
        ? { resultsCount: params.resultsCount }
        : undefined,
  });
}

export function trackFilter(params: { filterCategory: string; resultsCount?: number }): void {
  send({
    eventType: "filter",
    categoryName: params.filterCategory,
    source: "catalog",
  });
}

export function trackWhatsApp(params: TrackWhatsAppParams): void {
  send({
    eventType: "whatsapp_click",
    gameId: params.gameId,
    gameName: params.gameName,
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    source: params.source,
  });
}

export function trackPageView(params: TrackPageViewParams): void {
  send({
    eventType: "page_view",
    source: params.path,
  });
}

export function trackBeginCheckout(params: TrackBeginCheckoutParams): void {
  send({
    eventType: "begin_checkout",
    gameId: params.gameId,
    gameName: params.gameName,
    price: params.total,
    source: params.source,
  });
}

export function trackViewCart(params: TrackViewCartParams): void {
  send({
    eventType: "view_cart",
    source: params.source,
  });
}

export function trackAddPaymentInfo(params: TrackAddPaymentInfoParams): void {
  send({
    eventType: "add_payment_info",
    gameId: params.gameId,
    gameName: params.gameName,
    price: params.total,
    source: params.source,
  });
}

export function trackShare(params: TrackShareParams): void {
  send({
    eventType: "share",
    gameId: params.gameId,
    gameName: params.gameName,
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    source: params.source,
  });
}
