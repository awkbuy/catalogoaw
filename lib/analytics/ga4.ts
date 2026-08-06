import { GA_MEASUREMENT_ID } from "@/lib/analytics";

export interface Ga4ViewItemParams {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  discount?: number;
}

export interface Ga4AddToCartParams {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

export interface Ga4RemoveFromCartParams {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

export interface Ga4SearchParams {
  search_term: string;
  results_count?: number;
}

export interface Ga4BeginCheckoutParams {
  value: number;
  currency?: string;
  items_count?: number;
}

export interface Ga4WhatsAppParams {
  source: string;
}

function push(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

export function ga4TrackPageView(path: string, title?: string): void {
  push("page_view", {
    page_path: path,
    page_title: title || (typeof document !== "undefined" ? document.title : ""),
  });
}

export function ga4TrackViewItem(params: Ga4ViewItemParams): void {
  push("view_item", {
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        ...(params.item_category ? { item_category: params.item_category } : {}),
        ...(params.price !== undefined ? { price: params.price } : {}),
        ...(params.discount !== undefined ? { discount: params.discount } : {}),
      },
    ],
  });
}

export function ga4TrackAddToCart(params: Ga4AddToCartParams): void {
  push("add_to_cart", {
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        ...(params.item_category ? { item_category: params.item_category } : {}),
        ...(params.price !== undefined ? { price: params.price } : {}),
        quantity: params.quantity ?? 1,
      },
    ],
  });
}

export function ga4TrackRemoveFromCart(params: Ga4RemoveFromCartParams): void {
  push("remove_from_cart", {
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        ...(params.item_category ? { item_category: params.item_category } : {}),
        ...(params.price !== undefined ? { price: params.price } : {}),
        quantity: params.quantity ?? 1,
      },
    ],
  });
}

export function ga4TrackSearch(params: Ga4SearchParams): void {
  push("search", {
    search_term: params.search_term,
    ...(params.results_count !== undefined ? { results_count: params.results_count } : {}),
  });
}

export function ga4TrackBeginCheckout(params: Ga4BeginCheckoutParams): void {
  push("begin_checkout", {
    value: params.value,
    currency: params.currency || "ARS",
    ...(params.items_count !== undefined ? { items_count: params.items_count } : {}),
  });
}

export function ga4TrackWhatsApp(params: Ga4WhatsAppParams): void {
  push("click_whatsapp", {
    source: params.source,
  });
}

export function ga4Init(): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!GA_MEASUREMENT_ID) return;
  window.gtag?.("config", GA_MEASUREMENT_ID, { send_page_view: false });
}
