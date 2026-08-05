export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9HBTQN02YJ";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
