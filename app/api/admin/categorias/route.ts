import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categorias = await prisma.category.findMany({
    include: { _count: { select: { games: true } } },
    orderBy: { orden: "asc" },
  });

  return NextResponse.json(categorias);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  try {
    const categoria = await prisma.category.create({
      data: {
        nombre: data.nombre,
        icono: data.icono || null,
        color: data.color || "#31D3A9",
        tags: data.tags || "",
        orden: data.orden || 0,
      },
    });
    return NextResponse.json(categoria);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error creating category" }, { status: 500 });
  }
}
