export interface ClientMarketingConfig {
  ga4Enabled: boolean;
  metaPixelEnabled: boolean;
  metaCapiEnabled: boolean;
  metaPixelId: string;
}

export const DEFAULT_CLIENT_MARKETING_CONFIG: ClientMarketingConfig = {
  ga4Enabled: true,
  metaPixelEnabled: false,
  metaCapiEnabled: false,
  metaPixelId: "",
};

declare global {
  interface Window {
    __WR_MARKETING__?: ClientMarketingConfig;
  }
}

export function setClientMarketingConfig(config: ClientMarketingConfig): void {
  if (typeof window === "undefined") return;
  window.__WR_MARKETING__ = config;
}

export function getClientMarketingConfig(): ClientMarketingConfig {
  if (typeof window === "undefined") return DEFAULT_CLIENT_MARKETING_CONFIG;
  return window.__WR_MARKETING__ || DEFAULT_CLIENT_MARKETING_CONFIG;
}
