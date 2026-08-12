import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSeoSettings, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, games, landings] = await Promise.all([
    getSeoSettings(),
    prisma.game.findMany({
      where: { disponibleVenta: true, estado: "Disponible" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.landingPage.findMany({
      where: { isActive: true },
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

  for (const landing of landings) {
    if (!landing.slug) continue;
    entries.push({
      url: `${siteUrl}/${landing.slug}`,
      lastModified: landing.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  return entries;
}
