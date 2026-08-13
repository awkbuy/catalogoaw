import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantDbOrNull } from "@/lib/tenant";
import {
  getSeoSettings,
  buildLandingMetadata,
  breadcrumbJsonLd,
  getSiteUrl,
} from "@/lib/seo";
import { parsearHorarios } from "@/lib/horarios";
import { parseTaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import { getCuotasInfo, type PublicShippingZone } from "@/lib/ventas";
import { parseProductIds } from "@/lib/landings";
import JsonLd from "@/components/JsonLd";
import LandingPage from "@/components/LandingPage/LandingPage";
import type { PublicProduct } from "@/components/Catalog/Catalog";

export const dynamic = "force-dynamic";

const getLandingBySlug = cache(async (slug: string) => {
  const prisma = await getTenantDbOrNull();
  if (!prisma) return null;
  return prisma.landingPage.findUnique({ where: { slug } });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getLandingBySlug(slug);
  if (!landing || !landing.isActive) return {};
  const settings = await getSeoSettings();
  return buildLandingMetadata(settings, landing);
}

export default async function LandingPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = await getLandingBySlug(slug);
  if (!landing || !landing.isActive) notFound();

  const prisma = await getTenantDbOrNull();
  if (!prisma) notFound();

  const productIds = parseProductIds(landing.productIds);

  const [products, settings, paymentMethods, settingsRows, shippingZones] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          include: {
            categoria: { select: { nombre: true, icono: true, color: true } },
            categorias: { select: { nombre: true, icono: true, color: true } },
          },
        })
      : Promise.resolve([]),
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

  const publicShippingZones: PublicShippingZone[] = shippingZones.map((z) => ({
    id: z.id,
    name: z.name,
    cost: z.cost,
    freeFrom: z.freeFrom,
    consultar: z.consultar,
    active: z.active,
  }));

  const publicPaymentMethods: PublicPaymentMethod[] = paymentMethods.map((pm) => ({
    id: pm.id,
    titulo: pm.titulo,
    descripcion: pm.descripcion,
    icono: pm.icono,
    promocional: pm.promocional,
  }));

  const publicProducts: PublicProduct[] = products.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    descripcion: p.descripcion,
    categoria: {
      nombre: p.categoria.nombre,
      icono: p.categoria.icono,
      color: p.categoria.color,
    },
    categorias: p.categorias.map((c) => ({
      nombre: c.nombre,
      icono: c.icono,
      color: c.color,
    })),
    imagen: p.imagen,
    integrarVideo: p.integrarVideo,
    videoUrl: p.videoUrl,
    estado: p.estado,
    destacado: p.destacado,
    nuevo: p.nuevo,
    precioFinalVenta: p.precioFinalVenta,
    descuento: p.descuento,
    envioGratis: p.envioGratis,
    disponibleVenta: p.disponibleVenta,
  }));

  const siteUrl = getSiteUrl(settings);
  const breadcrumbs = [
    { name: "Inicio", url: siteUrl },
    { name: landing.title, url: `${siteUrl}/${landing.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <LandingPage
        products={publicProducts}
        slug={landing.slug}
        title={landing.title}
        description={landing.description}
        heroTitle={landing.heroTitle}
        heroDescription={landing.heroDescription}
        heroImage={landing.heroImage}
        bannerColor={landing.bannerColor}
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
    </>
  );
}
