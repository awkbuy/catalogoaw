import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { ClientMarketingConfig } from "./config";

export interface MarketingConfig extends ClientMarketingConfig {
  ga4MeasurementId: string;
  metaTestEventCode: string;
  metaBusinessId: string;
  metaCatalogId: string;
  clarityProjectId: string;
  clarityEnabled: boolean;
}

export const MARKETING_DEFAULT_GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9HBTQN02YJ";

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true";
}

export const getMarketingConfig = cache(async (): Promise<MarketingConfig> => {
  const rows = await prisma.setting.findMany();
  const s: Record<string, string> = {};
  for (const r of rows) {
    s[r.key] = r.value;
  }

  return {
    ga4MeasurementId: s.ga4MeasurementId || "",
    ga4Enabled: toBool(s.ga4Enabled, true),
    metaPixelId: s.metaPixelId || "",
    metaPixelEnabled: toBool(s.metaPixelEnabled, false),
    metaCapiEnabled: toBool(s.metaCapiEnabled, false),
    metaTestEventCode: s.metaTestEventCode || "",
    metaBusinessId: s.metaBusinessId || "",
    metaCatalogId: s.metaCatalogId || "",
    clarityProjectId: s.clarityProjectId || "",
    clarityEnabled: toBool(s.clarityEnabled, false),
  };
});

export function toClientConfig(config: MarketingConfig): ClientMarketingConfig {
  return {
    ga4Enabled: config.ga4Enabled,
    metaPixelEnabled: config.metaPixelEnabled,
    metaCapiEnabled: config.metaCapiEnabled,
    metaPixelId: config.metaPixelId,
  };
}
