import { NextResponse } from "next/server";
import { getSeoSettings } from "@/lib/seo";
import {
  availabilityFor,
  conditionFor,
  feedDescription,
  feedFinalPrice,
  loadFeedProducts,
} from "@/lib/marketing/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, products] = await Promise.all([
    getSeoSettings(),
    loadFeedProducts({ anyFeed: true }),
  ]);
  const siteUrl = new URL(settings.url || "https://catalogoapp.com").origin;

  const payload = products.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    descripcion: feedDescription(p),
    url: `${siteUrl}/productos/${p.slug}`,
    imagen: p.imagen,
    categoria: p.categoriaNombre,
    precioFinalVenta: feedFinalPrice(p),
    moneda: "ARS",
    disponibilidad: availabilityFor(p.disponibleVenta),
    condicion: conditionFor(p.condition),
    disponibleVenta: p.disponibleVenta,
    showInMerchant: p.showInMerchant,
    showInMetaCommerce: p.showInMetaCommerce,
    googleProductCategory: p.googleProductCategory,
    metaProductCategory: p.metaProductCategory,
    gtin: p.gtin,
    mpn: p.mpn,
    brand: p.brand,
  }));

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
    },
  });
}
