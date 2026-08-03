import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.paymentMethod.findMany({ orderBy: { orden: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const titulo = String(data.titulo || "").trim();
  const descripcion = String(data.descripcion || "").trim();

  if (!titulo && !descripcion) {
    return NextResponse.json(
      { error: "Ingresá un título o una descripción" },
      { status: 400 }
    );
  }

  try {
    const item = await prisma.paymentMethod.create({
      data: {
        titulo,
        descripcion,
        icono: String(data.icono || "credit_card"),
        activo: data.activo !== false,
        orden: Math.max(0, Number(data.orden) || 0),
        promocional: data.promocional === true,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creando medio de pago" },
      { status: 500 }
    );
  }
}
