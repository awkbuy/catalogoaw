import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getSeoSettings,
  buildLandingMetadata,
  breadcrumbJsonLd,
  getSiteUrl,
} from "@/lib/seo";
import { parsearHorarios } from "@/lib/horarios";
import { parseTaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import { parseGameIds } from "@/lib/landings";
import JsonLd from "@/components/JsonLd";
import LandingPage from "@/components/LandingPage/LandingPage";
import type { PublicGame } from "@/components/Catalog/Catalog";

export const dynamic = "force-dynamic";

const getLandingBySlug = cache(async (slug: string) => {
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

  const gameIds = parseGameIds(landing.gameIds);

  const [games, settings, paymentMethods, settingsRows] = await Promise.all([
    gameIds.length > 0
      ? prisma.game.findMany({
          where: { id: { in: gameIds } },
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
  ]);

  const rawSettings: Record<string, string> = {};
  for (const s of settingsRows) {
    rawSettings[s.key] = s.value;
  }

  const whatsappNumber = rawSettings.whatsapp || rawSettings.telefono || "";
  const businessName = rawSettings.nombreNegocio || "Wolfie Room";
  const logoUrl = rawSettings.logoUrl || null;
  const horarios = parsearHorarios(rawSettings.horarios_semana);
  const taxConfig = parseTaxConfig(rawSettings);

  const publicPaymentMethods: PublicPaymentMethod[] = paymentMethods.map((pm) => ({
    id: pm.id,
    titulo: pm.titulo,
    descripcion: pm.descripcion,
    icono: pm.icono,
    promocional: pm.promocional,
  }));

  const publicGames: PublicGame[] = games.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    slug: g.slug,
    descripcion: g.descripcion,
    categoria: {
      nombre: g.categoria.nombre,
      icono: g.categoria.icono,
      color: g.categoria.color,
    },
    categorias: g.categorias.map((c) => ({
      nombre: c.nombre,
      icono: c.icono,
      color: c.color,
    })),
    jugadoresMin: g.jugadoresMin,
    jugadoresMax: g.jugadoresMax,
    duracion: g.duracion,
    edad: g.edad,
    dificultad: g.dificultad,
    imagen: g.imagen,
    integrarVideo: g.integrarVideo,
    videoUrl: g.videoUrl,
    estado: g.estado,
    destacado: g.destacado,
    nuevo: g.nuevo,
    precioFinalVenta: g.precioFinalVenta,
    descuento: g.descuento,
    disponibleVenta: g.disponibleVenta,
    disponibleMesa: g.disponibleMesa,
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
        games={publicGames}
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
        taxConfig={taxConfig}
        paymentMethods={publicPaymentMethods}
      />
    </>
  );
}
