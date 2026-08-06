import { getClientMarketingConfig } from "./config";
import { metaTrack } from "./meta";
import {
  trackAddToCart,
  trackBeginCheckout,
  trackFilter,
  trackPageView,
  trackRemoveFromCart,
  trackSearch,
  trackViewCart,
  trackViewItem,
  trackWhatsApp,
} from "@/lib/analytics/events";
import {
  ga4TrackAddToCart,
  ga4TrackBeginCheckout,
  ga4TrackPageView,
  ga4TrackRemoveFromCart,
  ga4TrackSearch,
  ga4TrackViewItem,
  ga4TrackWhatsApp,
} from "@/lib/analytics/ga4";

export type MarketingEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "ViewCategory"
  | "AddToCart"
  | "RemoveFromCart"
  | "ViewCart"
  | "InitiateCheckout"
  | "ClickWhatsApp";

export interface MarketingEventData {
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  quantity?: number;
  search_term?: string;
  path?: string;
  source?: string;
}

export interface MarketingEvent {
  event: MarketingEventName;
  data?: MarketingEventData;
  event_id?: string;
}

function generateEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function firstId(data: MarketingEventData): string | undefined {
  return data.content_ids && data.content_ids.length > 0
    ? data.content_ids[0]
    : undefined;
}

let hasSentInitialGa4PageView = false;

function dispatchToGa4(event: MarketingEvent): void {
  const data = event.data || {};
  switch (event.event) {
    case "PageView": {
      if (!hasSentInitialGa4PageView) {
        hasSentInitialGa4PageView = true;
        return;
      }
      ga4TrackPageView(data.path || window.location.pathname);
      break;
    }
    case "ViewContent": {
      const id = firstId(data);
      if (id) {
        ga4TrackViewItem({
          item_id: id,
          item_name: data.content_name || id,
          item_category: data.content_category,
          price: data.value,
        });
      }
      break;
    }
    case "Search":
      ga4TrackSearch({
        search_term: data.search_term || "",
        results_count: data.quantity,
      });
      break;
    case "AddToCart": {
      const id = firstId(data);
      if (id) {
        ga4TrackAddToCart({
          item_id: id,
          item_name: data.content_name || id,
          item_category: data.content_category,
          price: data.value,
          quantity: data.quantity,
        });
      }
      break;
    }
    case "RemoveFromCart": {
      const id = firstId(data);
      if (id) {
        ga4TrackRemoveFromCart({
          item_id: id,
          item_name: data.content_name || id,
          item_category: data.content_category,
          price: data.value,
          quantity: data.quantity,
        });
      }
      break;
    }
    case "InitiateCheckout":
      ga4TrackBeginCheckout({
        value: data.value ?? 0,
        currency: data.currency || "ARS",
        items_count: data.quantity,
      });
      break;
    case "ClickWhatsApp":
      ga4TrackWhatsApp({ source: data.source || "" });
      break;
    default:
      break;
  }
}

function dispatchToPixel(event: MarketingEvent, eventId: string): void {
  const data = event.data || {};
  const base = {
    content_ids: data.content_ids,
    content_type: data.content_type,
    content_name: data.content_name,
    content_category: data.content_category,
    value: data.value,
    currency: data.currency,
    quantity: data.quantity,
  };
  switch (event.event) {
    case "PageView":
      metaTrack("PageView", undefined, eventId);
      break;
    case "ViewContent":
      metaTrack("ViewContent", base, eventId);
      break;
    case "Search":
      metaTrack("Search", { search_string: data.search_term }, eventId);
      break;
    case "ViewCategory":
      metaTrack(
        "ViewCategory",
        {
          content_ids: data.content_ids,
          content_category: data.content_category,
        },
        eventId
      );
      break;
    case "AddToCart":
      metaTrack("AddToCart", base, eventId);
      break;
    case "InitiateCheckout":
      metaTrack("InitiateCheckout", base, eventId);
      break;
    default:
      break;
  }
}

function dispatchToOwnAnalytics(event: MarketingEvent): void {
  const data = event.data || {};
  const id = firstId(data);
  switch (event.event) {
    case "PageView":
      trackPageView({ path: data.path || window.location.pathname + window.location.search });
      break;
    case "ViewContent":
      if (id) {
        trackViewItem({
          gameId: id,
          gameName: data.content_name || id,
          categoryName: data.content_category,
          price: data.value,
          source: data.source,
        });
      }
      break;
    case "Search":
      trackSearch({
        searchTerm: data.search_term || "",
        resultsCount: data.quantity,
        source: data.source,
      });
      break;
    case "ViewCategory":
      trackFilter({
        filterCategory: data.content_category || "",
        resultsCount: data.quantity,
      });
      break;
    case "AddToCart":
      if (id) {
        trackAddToCart({
          gameId: id,
          gameName: data.content_name || id,
          categoryName: data.content_category,
          price: data.value,
          source: data.source,
        });
      }
      break;
    case "RemoveFromCart":
      if (id) {
        trackRemoveFromCart({
          gameId: id,
          gameName: data.content_name || id,
          price: data.value,
          source: data.source,
        });
      }
      break;
    case "ViewCart":
      trackViewCart({
        itemsCount: data.quantity ?? 0,
        source: data.source,
      });
      break;
    case "InitiateCheckout":
      trackBeginCheckout({
        total: data.value ?? 0,
        itemsCount: data.quantity ?? 0,
        gameId: id,
        gameName: data.content_name,
        source: data.source,
      });
      break;
    case "ClickWhatsApp":
      trackWhatsApp({
        source: data.source || "",
        gameId: id,
        gameName: data.content_name,
        categoryName: data.content_category,
      });
      break;
  }
}

function dispatchToCapi(event: MarketingEvent, eventId: string): void {
  const data = event.data || {};
  fetch("/api/marketing/capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: event.event,
      event_id: eventId,
      data: {
        content_ids: data.content_ids,
        content_type: data.content_type,
        content_name: data.content_name,
        content_category: data.content_category,
        value: data.value,
        currency: data.currency,
        quantity: data.quantity,
        search_term: data.search_term,
        source: data.source,
      },
    }),
    keepalive: true,
  }).catch(() => {
    // silencio: el tracking nunca debe romper la UX
  });
}

export function trackMarketingEvent(event: MarketingEvent): void {
  if (typeof window === "undefined") return;
  const config = getClientMarketingConfig();
  const eventId = event.event_id || generateEventId();

  if (config.ga4Enabled) dispatchToGa4(event);
  if (config.metaPixelEnabled && config.metaPixelId) dispatchToPixel(event, eventId);
  dispatchToOwnAnalytics(event);
  if (config.metaCapiEnabled) dispatchToCapi(event, eventId);
}
