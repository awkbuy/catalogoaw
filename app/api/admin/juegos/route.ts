import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, sanitizeError } from "@/lib/errors";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const juegos = await prisma.game.findMany({
    include: {
      categoria: { select: { nombre: true, color: true } },
      categorias: { select: { id: true, nombre: true, color: true } },
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(juegos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  try {
    const categoriaIds = parseCategoriaIds(data);
    const juego = await prisma.game.create({
      data: {
        nombre: String(data.nombre || ""),
        slug: String(data.slug || ""),
        descripcion: String(data.descripcion || ""),
        categoriaId: String(data.categoriaId || ""),
        categorias: { connect: categoriaIds.map((id) => ({ id })) },
        jugadoresMin: Math.max(1, Number(data.jugadoresMin) || 2),
        jugadoresMax: Math.max(1, Number(data.jugadoresMax) || 6),
        duracion: String(data.duracion || ""),
        edad: String(data.edad || ""),
        dificultad: String(data.dificultad || ""),
        precioFinalVenta: String(data.precioFinalVenta || ""),
        descuento: Math.max(0, Number(data.descuento) || 0),
        imagen: String(data.imagen || ""),
        integrarVideo: data.integrarVideo === true,
        videoUrl: String(data.videoUrl || ""),
        estado: String(data.estado || "Disponible"),
        destacado: data.destacado === true,
        nuevo: data.nuevo === true,
        disponibleVenta: data.disponibleVenta === true,
        disponibleMesa: data.disponibleMesa === true,
        orden: Math.max(0, Number(data.orden) || 0),
        seoTitle: String(data.seoTitle || ""),
        seoDescription: String(data.seoDescription || ""),
        seoKeywords: String(data.seoKeywords || ""),
        canonical: String(data.canonical || ""),
        imagenAlt: String(data.imagenAlt || ""),
        descripcionAccesible: String(data.descripcionAccesible || ""),
        resumenIA: String(data.resumenIA || ""),
        showInMerchant: data.showInMerchant === true,
        showInMetaCommerce: data.showInMetaCommerce === true,
        allowDynamicAds: data.allowDynamicAds === true,
        marketingFeatured: data.marketingFeatured === true,
        remarketingEligible: data.remarketingEligible === true,
        googleProductCategory: String(data.googleProductCategory || ""),
        metaProductCategory: String(data.metaProductCategory || ""),
        gtin: String(data.gtin || ""),
        mpn: String(data.mpn || ""),
        brand: String(data.brand || "Wolfie Room"),
        condition: String(data.condition || "new"),
        marketingPriority: Math.max(0, Number(data.marketingPriority) || 0),
      },
    });
    return NextResponse.json(juego);
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}

function parseCategoriaIds(data: Record<string, unknown>): string[] {
  const raw = data.categoriaIds;
  const ids = Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  const primary = String(data.categoriaId || "");
  const all = new Set<string>();
  if (primary) all.add(primary);
  for (const id of ids) all.add(id);
  return [...all];
}
