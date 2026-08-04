import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/errors";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const juegos = await prisma.game.findMany({
    include: { categoria: { select: { nombre: true, color: true } } },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(juegos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  try {
    const juego = await prisma.game.create({
      data: {
        nombre: data.nombre,
        slug: data.slug,
        descripcion: data.descripcion || "",
        categoriaId: data.categoriaId,
        jugadoresMin: data.jugadoresMin,
        jugadoresMax: data.jugadoresMax,
        duracion: data.duracion || "",
        edad: data.edad || "",
        dificultad: data.dificultad || "",
        precioFinalVenta: data.precioFinalVenta || "",
        descuento: data.descuento || 0,
        imagen: data.imagen || "",
        integrarVideo: data.integrarVideo === true,
        videoUrl: data.videoUrl || "",
        estado: data.estado || "Disponible",
        destacado: data.destacado || false,
        nuevo: data.nuevo || false,
        disponibleVenta: data.disponibleVenta || false,
        disponibleMesa: data.disponibleMesa || false,
        orden: data.orden || 0,
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        seoKeywords: data.seoKeywords || "",
        canonical: data.canonical || "",
        imagenAlt: data.imagenAlt || "",
        descripcionAccesible: data.descripcionAccesible || "",
        resumenIA: data.resumenIA || "",
      },
    });
    return NextResponse.json(juego);
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
