import type { MetadataRoute } from "next";
import { getSeoSettings, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const ADMIN_DISALLOW = [
  "/login",
  "/dashboard",
  "/api/",
  "/games",
  "/categories",
  "/landings",
  "/cupones",
  "/pagos",
  "/envios",
  "/horarios",
  "/seo",
  "/settings",
  "/account",
  "/marketing",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSeoSettings();
  const siteUrl = getSiteUrl(settings);

  return {
    rules: {
      userAgent: "*",
      allow: settings.index ? "/" : undefined,
      disallow: settings.index ? ADMIN_DISALLOW : "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
