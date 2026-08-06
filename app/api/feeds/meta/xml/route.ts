import { NextResponse } from "next/server";
import { getSeoSettings } from "@/lib/seo";
import { buildMetaFeedXml, loadFeedGames } from "@/lib/marketing/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, games] = await Promise.all([
    getSeoSettings(),
    loadFeedGames({ metaOnly: true, withPriceOnly: true }),
  ]);
  const xml = buildMetaFeedXml(settings, games);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
    },
  });
}
