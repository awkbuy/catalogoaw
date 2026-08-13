import { NextResponse } from "next/server";
import { getSeoSettings } from "@/lib/seo";
import { buildMetaFeedXml, loadFeedProducts } from "@/lib/marketing/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, products] = await Promise.all([
    getSeoSettings(),
    loadFeedProducts({ metaOnly: true, withPriceOnly: true }),
  ]);
  const xml = buildMetaFeedXml(settings, products);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
    },
  });
}
