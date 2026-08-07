import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getSeoSettings,
  buildGameMetadata,
  productJsonLd,
  breadcrumbJsonLd,
  getSiteUrl,
  type GameSeoSource,
} from "@/lib/seo";
import { parsearHorarios } from "@/lib/horarios";
import { parseTaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import JsonLd from "@/components/JsonLd";
import ProductDetailPage from "@/components/ProductDetailPage";
import { CartProvider } from "@/lib/cart-context";

export const dynamic = "force-dynamic";

const getGameBySlug = cache(async (slug: string) => {
  return prisma.game.findUnique({
    where: { slug },
    include: {
      categoria: { select: { nombre: true, icono: true, color: true } },
      categorias: { select: { nombre: true, icono: true, color: true } },
    },
  });
});

type GameWithCategoria = NonNullable<Awaited<ReturnType<typeof getGameBySlug>>>;

function toSeoSource(game: GameWithCategoria): GameSeoSource {
  return {
    nombre: game.nombre,
    slug: game.slug,
    descripcion: game.descripcion,
    imagen: game.imagen,
    categoriaNombre: game.categoria.nombre,
    jugadoresMin: game.jugadoresMin,
    jugadoresMax: game.jugadoresMax,
    duracion: game.duracion,
    edad: game.edad,
    dificultad: game.dificultad,
    precioFinalVenta: game.precioFinalVenta,
    descuento: game.descuento,
    disponibleVenta: game.disponibleVenta,
    seoTitle: game.seoTitle,
    seoDescription: game.seoDescription,
    seoKeywords: game.seoKeywords,
    canonical: game.canonical,
    imagenAlt: game.imagenAlt,
    descripcionAccesible: game.descripcionAccesible,
    resumenIA: game.resumenIA,
    updatedAt: game.updatedAt,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return {};
  const settings = await getSeoSettings();
  return buildGameMetadata(settings, toSeoSource(game));
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const [settings, paymentMethods, settingsRows] = await Promise.all([
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

  const source = toSeoSource(game);
  const siteUrl = getSiteUrl(settings);
  const breadcrumbs = [
    { name: "Inicio", url: siteUrl },
    {
      name: game.categoria.nombre,
      url: `${siteUrl}/?categoria=${encodeURIComponent(game.categoria.nombre)}`,
    },
    { name: game.nombre, url: `${siteUrl}/juegos/${game.slug}` },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(settings, source)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <CartProvider>
        <ProductDetailPage
          game={{
            id: game.id,
            slug: game.slug,
            nombre: game.nombre,
            descripcion: game.descripcion,
            categoria: {
              nombre: game.categoria.nombre,
              icono: game.categoria.icono,
              color: game.categoria.color,
            },
            categorias: game.categorias.map((c) => ({
              nombre: c.nombre,
              icono: c.icono,
              color: c.color,
            })),
            jugadoresMin: game.jugadoresMin,
            jugadoresMax: game.jugadoresMax,
            duracion: game.duracion,
            edad: game.edad,
            dificultad: game.dificultad,
            imagen: game.imagen,
            integrarVideo: game.integrarVideo,
            videoUrl: game.videoUrl,
            precioFinalVenta: game.precioFinalVenta,
            descuento: game.descuento,
            disponibleVenta: game.disponibleVenta,
            disponibleMesa: game.disponibleMesa,
          }}
          whatsappNumber={whatsappNumber}
          businessName={businessName}
          logoUrl={logoUrl}
          horarios={horarios}
          taxConfig={taxConfig}
          paymentMethods={publicPaymentMethods}
        />
      </CartProvider>
    </>
  );
}
