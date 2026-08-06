import { prisma } from "@/lib/prisma";
import { feedFinalPrice, type FeedGame } from "./utils";

export interface FeedQuery {
  merchantOnly?: boolean;
  metaOnly?: boolean;
  anyFeed?: boolean;
  withPriceOnly?: boolean;
}

export async function loadFeedGames(query: FeedQuery = {}): Promise<FeedGame[]> {
  const where: Record<string, unknown> = {};
  if (query.merchantOnly) where.showInMerchant = true;
  if (query.metaOnly) where.showInMetaCommerce = true;
  if (query.anyFeed) {
    where.OR = [{ showInMerchant: true }, { showInMetaCommerce: true }];
  }

  const games = await prisma.game.findMany({
    where,
    select: {
      id: true,
      nombre: true,
      slug: true,
      descripcion: true,
      seoDescription: true,
      imagen: true,
      precioFinalVenta: true,
      descuento: true,
      disponibleVenta: true,
      showInMerchant: true,
      showInMetaCommerce: true,
      googleProductCategory: true,
      metaProductCategory: true,
      gtin: true,
      mpn: true,
      brand: true,
      condition: true,
      marketingPriority: true,
      categoria: { select: { nombre: true } },
    },
    orderBy: [{ marketingPriority: "desc" }, { nombre: "asc" }],
  });

  let mapped: FeedGame[] = games.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    slug: g.slug,
    descripcion: g.descripcion,
    seoDescription: g.seoDescription,
    imagen: g.imagen,
    categoriaNombre: g.categoria.nombre,
    precioFinalVenta: g.precioFinalVenta,
    descuento: g.descuento,
    disponibleVenta: g.disponibleVenta,
    showInMerchant: g.showInMerchant,
    showInMetaCommerce: g.showInMetaCommerce,
    googleProductCategory: g.googleProductCategory,
    metaProductCategory: g.metaProductCategory,
    gtin: g.gtin,
    mpn: g.mpn,
    brand: g.brand,
    condition: g.condition,
  }));

  if (query.withPriceOnly) {
    mapped = mapped.filter((g) => feedFinalPrice(g) > 0);
  }

  return mapped;
}
