import { NextResponse } from "next/server";
import { getSeoSettings } from "@/lib/seo";
import { buildMetaFeedCsv, loadFeedGames } from "@/lib/marketing/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, games] = await Promise.all([
    getSeoSettings(),
    loadFeedGames({ metaOnly: true, withPriceOnly: true }),
  ]);
  const csv = buildMetaFeedCsv(settings, games);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
    },
  });
}
