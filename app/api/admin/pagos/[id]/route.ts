import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/errors";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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
    const item = await prisma.paymentMethod.update({
      where: { id },
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
      { error: sanitizeError(error) },
      { status: 500 }
    );
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
    await prisma.paymentMethod.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
