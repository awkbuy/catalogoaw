import { NextResponse } from "next/server";
import { getSeoSettings } from "@/lib/seo";
import { buildMetaFeedCsv, loadFeedProducts } from "@/lib/marketing/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, products] = await Promise.all([
    getSeoSettings(),
    loadFeedProducts({ metaOnly: true, withPriceOnly: true }),
  ]);
  const csv = buildMetaFeedCsv(settings, products);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
    },
  });
}
