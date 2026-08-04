import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const juego = await prisma.game.findUnique({
    where: { id },
    include: { categoria: { select: { nombre: true, color: true } } },
  });

  if (!juego) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(juego);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  try {
    const juego = await prisma.game.update({
      where: { id },
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.game.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
