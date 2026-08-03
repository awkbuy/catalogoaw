import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSeoSettings, getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, games] = await Promise.all([
    getSeoSettings(),
    prisma.game.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const siteUrl = getSiteUrl(settings);

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const game of games) {
    if (!game.slug) continue;
    entries.push({
      url: `${siteUrl}/juegos/${game.slug}`,
      lastModified: game.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}
