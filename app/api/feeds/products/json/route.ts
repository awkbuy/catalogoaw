import { NextResponse } from "next/server";
import { getSeoSettings } from "@/lib/seo";
import {
  availabilityFor,
  conditionFor,
  feedDescription,
  feedFinalPrice,
  loadFeedGames,
} from "@/lib/marketing/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, games] = await Promise.all([
    getSeoSettings(),
    loadFeedGames({ anyFeed: true }),
  ]);
  const siteUrl = new URL(settings.url || "https://wolfiesroom.com").origin;

  const payload = games.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    slug: g.slug,
    descripcion: feedDescription(g),
    url: `${siteUrl}/juegos/${g.slug}`,
    imagen: g.imagen,
    categoria: g.categoriaNombre,
    precioFinalVenta: feedFinalPrice(g),
    moneda: "ARS",
    disponibilidad: availabilityFor(g.disponibleVenta),
    condicion: conditionFor(g.condition),
    disponibleVenta: g.disponibleVenta,
    showInMerchant: g.showInMerchant,
    showInMetaCommerce: g.showInMetaCommerce,
    googleProductCategory: g.googleProductCategory,
    metaProductCategory: g.metaProductCategory,
    gtin: g.gtin,
    mpn: g.mpn,
    brand: g.brand,
  }));

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
    },
  });
}
