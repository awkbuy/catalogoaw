declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function initMetaPixel(pixelId: string): void {
  if (typeof window === "undefined" || !pixelId) return;
  if (typeof window.fbq !== "function") return;
  window.fbq("init", pixelId);
}

export function metaTrack(
  event: string,
  data?: Record<string, unknown>,
  eventID?: string
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventID) {
    window.fbq("track", event, data ?? {}, { eventID });
  } else {
    window.fbq("track", event, data ?? {});
  }
}

export function metaTrackCustom(
  event: string,
  data?: Record<string, unknown>,
  eventID?: string
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventID) {
    window.fbq("trackCustom", event, data ?? {}, { eventID });
  } else {
    window.fbq("trackCustom", event, data ?? {});
  }
}
