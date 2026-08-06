import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import GameForm from "@/components/admin/GameForm";

export const dynamic = "force-dynamic";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [juego, categorias] = await Promise.all([
    prisma.game.findUnique({
      where: { id },
      include: { categorias: { select: { id: true } } },
    }),
    prisma.category.findMany({
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  if (!juego) notFound();

  const gameData = {
    id: juego.id,
    nombre: juego.nombre,
    slug: juego.slug,
    descripcion: juego.descripcion || "",
    categoriaId: juego.categoriaId,
    categoriaIds: juego.categorias.map((c) => c.id),
    jugadoresMin: String(juego.jugadoresMin),
    jugadoresMax: String(juego.jugadoresMax),
    duracion: juego.duracion || "",
    edad: juego.edad || "",
    dificultad: juego.dificultad || "",
    precioFinalVenta: juego.precioFinalVenta || "",
    descuento: String(juego.descuento),
    imagen: juego.imagen || "",
    integrarVideo: juego.integrarVideo,
    videoUrl: juego.videoUrl || "",
    estado: juego.estado,
    destacado: juego.destacado,
    nuevo: juego.nuevo,
    disponibleVenta: juego.disponibleVenta,
    disponibleMesa: juego.disponibleMesa,
    orden: String(juego.orden),
    seoTitle: juego.seoTitle || "",
    seoDescription: juego.seoDescription || "",
    seoKeywords: juego.seoKeywords || "",
    canonical: juego.canonical || "",
    imagenAlt: juego.imagenAlt || "",
    descripcionAccesible: juego.descripcionAccesible || "",
    resumenIA: juego.resumenIA || "",
    showInMerchant: juego.showInMerchant,
    showInMetaCommerce: juego.showInMetaCommerce,
    allowDynamicAds: juego.allowDynamicAds,
    marketingFeatured: juego.marketingFeatured,
    remarketingEligible: juego.remarketingEligible,
    googleProductCategory: juego.googleProductCategory || "",
    metaProductCategory: juego.metaProductCategory || "",
    gtin: juego.gtin || "",
    mpn: juego.mpn || "",
    brand: juego.brand || "Wolfie Room",
    condition: juego.condition || "new",
    marketingPriority: String(juego.marketingPriority),
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Editar juego</h1>
        <p className="text-[#6B7280] text-sm mt-1">{juego.nombre}</p>
      </div>
      <GameForm
        initialData={gameData}
        categorias={categorias}
        mode="edit"
      />
    </div>
  );
}
