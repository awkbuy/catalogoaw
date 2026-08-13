import { getTenantDb } from "@/lib/tenant";
import { feedFinalPrice, type FeedProduct } from "./utils";

export interface FeedQuery {
  merchantOnly?: boolean;
  metaOnly?: boolean;
  anyFeed?: boolean;
  withPriceOnly?: boolean;
}

export async function loadFeedProducts(query: FeedQuery = {}): Promise<FeedProduct[]> {
  const prisma = await getTenantDb();
  const where: Record<string, unknown> = {};
  if (query.merchantOnly) where.showInMerchant = true;
  if (query.metaOnly) where.showInMetaCommerce = true;
  if (query.anyFeed) {
    where.OR = [{ showInMerchant: true }, { showInMetaCommerce: true }];
  }

  const products = await prisma.product.findMany({
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

  let mapped: FeedProduct[] = products.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    descripcion: p.descripcion,
    seoDescription: p.seoDescription,
    imagen: p.imagen,
    categoriaNombre: p.categoria.nombre,
    precioFinalVenta: p.precioFinalVenta,
    descuento: p.descuento,
    disponibleVenta: p.disponibleVenta,
    showInMerchant: p.showInMerchant,
    showInMetaCommerce: p.showInMetaCommerce,
    googleProductCategory: p.googleProductCategory,
    metaProductCategory: p.metaProductCategory,
    gtin: p.gtin,
    mpn: p.mpn,
    brand: p.brand,
    condition: p.condition,
  }));

  if (query.withPriceOnly) {
    mapped = mapped.filter((p) => feedFinalPrice(p) > 0);
  }

  return mapped;
}
