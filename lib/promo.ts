import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface PromoConfig {
  popupEnabled: boolean;
  popupImage: string;
  popupTitle: string;
  popupText: string;
  popupDelaySeconds: number;
  announcementEnabled: boolean;
  announcementText: string;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true";
}

function toNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const getPromoConfig = cache(async (): Promise<PromoConfig> => {
  const rows = await prisma.setting.findMany();
  const s: Record<string, string> = {};
  for (const r of rows) {
    s[r.key] = r.value;
  }

  return {
    popupEnabled: toBool(s.popupEnabled, false),
    popupImage: s.popupImage || "",
    popupTitle: s.popupTitle || "",
    popupText: s.popupText || "",
    popupDelaySeconds: toNumber(s.popupDelaySeconds, 10),
    announcementEnabled: toBool(s.announcementEnabled, false),
    announcementText: s.announcementText || "",
  };
});
