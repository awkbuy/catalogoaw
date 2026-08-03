import type { MetadataRoute } from "next";
import { getSeoSettings, getSiteUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSeoSettings();
  const siteUrl = getSiteUrl(settings);

  return {
    rules: {
      userAgent: "*",
      allow: settings.index ? "/" : undefined,
      disallow: settings.index ? undefined : "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
