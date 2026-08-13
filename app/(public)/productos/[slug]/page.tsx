import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantDbOrNull } from "@/lib/tenant";
import {
  getSeoSettings,
  buildProductMetadata,
  productJsonLd,
  breadcrumbJsonLd,
  getSiteUrl,
  type ProductSeoSource,
} from "@/lib/seo";
import { parsearHorarios } from "@/lib/horarios";
import { parseTaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import { getCuotasInfo, type PublicShippingZone } from "@/lib/ventas";
import JsonLd from "@/components/JsonLd";
import ProductDetailPage from "@/components/ProductDetailPage";
import { CartProvider } from "@/lib/cart-context";

export const dynamic = "force-dynamic";

function toSeoSource(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>): ProductSeoSource {
  return {
    nombre: product.nombre,
    slug: product.slug,
    descripcion: product.descripcion,
    imagen: product.imagen,
    categoriaNombre: product.categoria.nombre,
    precioFinalVenta: product.precioFinalVenta,
    descuento: product.descuento,
    disponibleVenta: product.disponibleVenta,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    seoKeywords: product.seoKeywords,
    canonical: product.canonical,
    imagenAlt: product.imagenAlt,
    descripcionAccesible: product.descripcionAccesible,
    resumenIA: product.resumenIA,
    gtin: product.gtin,
    mpn: product.mpn,
    brand: product.brand,
    condition: product.condition,
    updatedAt: product.updatedAt,
  };
}

const getProductBySlug = cache(async (slug: string) => {
  const prisma = await getTenantDbOrNull();
  if (!prisma) return null;
  return prisma.product.findUnique({
    where: { slug },
    include: {
      categoria: { select: { nombre: true, icono: true, color: true } },
      categorias: { select: { nombre: true, icono: true, color: true } },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const settings = await getSeoSettings();
  return buildProductMetadata(settings, toSeoSource(product));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const prisma = await getTenantDbOrNull();
  if (!prisma) notFound();

  const [settings, paymentMethods, settingsRows, shippingZones] = await Promise.all([
    getSeoSettings(),
    prisma.paymentMethod.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.setting.findMany(),
    prisma.shippingZone.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const rawSettings: Record<string, string> = {};
  for (const s of settingsRows) {
    rawSettings[s.key] = s.value;
  }

  const whatsappNumber = rawSettings.whatsapp || rawSettings.telefono || "";
  const businessName = rawSettings.nombreNegocio || "Catalogo App";
  const logoUrl = rawSettings.logoUrl || null;
  const direccion = rawSettings.direccion || "";
  const ciudad = rawSettings.ciudad || "";
  const horarios = parsearHorarios(rawSettings.horarios_semana);
  const taxConfig = parseTaxConfig(rawSettings);
  const cuotasInfo = getCuotasInfo(rawSettings);

  const publicPaymentMethods: PublicPaymentMethod[] = paymentMethods.map((pm) => ({
    id: pm.id,
    titulo: pm.titulo,
    descripcion: pm.descripcion,
    icono: pm.icono,
    promocional: pm.promocional,
  }));

  const publicShippingZones: PublicShippingZone[] = shippingZones.map((z) => ({
    id: z.id,
    name: z.name,
    cost: z.cost,
    freeFrom: z.freeFrom,
    consultar: z.consultar,
    active: z.active,
  }));

  const source = toSeoSource(product);
  const siteUrl = getSiteUrl(settings);
  const breadcrumbs = [
    { name: "Inicio", url: siteUrl },
    {
      name: product.categoria.nombre,
      url: `${siteUrl}/?categoria=${encodeURIComponent(product.categoria.nombre)}`,
    },
    { name: product.nombre, url: `${siteUrl}/productos/${product.slug}` },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(settings, source)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <CartProvider>
        <ProductDetailPage
          product={{
            id: product.id,
            slug: product.slug,
            nombre: product.nombre,
            descripcion: product.descripcion,
            categoria: {
              nombre: product.categoria.nombre,
              icono: product.categoria.icono,
              color: product.categoria.color,
            },
            categorias: product.categorias.map((c) => ({
              nombre: c.nombre,
              icono: c.icono,
              color: c.color,
            })),
            imagen: product.imagen,
            integrarVideo: product.integrarVideo,
            videoUrl: product.videoUrl,
            precioFinalVenta: product.precioFinalVenta,
            descuento: product.descuento,
            envioGratis: product.envioGratis,
            disponibleVenta: product.disponibleVenta,
          }}
          whatsappNumber={whatsappNumber}
          businessName={businessName}
          logoUrl={logoUrl}
          horarios={horarios}
          direccion={direccion}
          ciudad={ciudad}
          taxConfig={taxConfig}
          paymentMethods={publicPaymentMethods}
          cuotasInfo={cuotasInfo}
          envioZonas={publicShippingZones}
        />
      </CartProvider>
    </>
  );
}
