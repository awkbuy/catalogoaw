export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9HBTQN02YJ";

export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "view_item",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "search",
  "filter",
  "whatsapp_click",
  "begin_checkout",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export function isAnalyticsEventType(value: string): value is AnalyticsEventType {
  return (ANALYTICS_EVENT_TYPES as readonly string[]).includes(value);
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export {};
