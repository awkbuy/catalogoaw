import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, sanitizeError, isPrismaNotFound } from "@/lib/errors";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const codigo = String(data.codigo || "").trim().toUpperCase();

  if (!codigo) {
    return NextResponse.json({ error: "Ingresá un código de cupón" }, { status: 400 });
  }

  const tipo = data.tipo === "monto" ? "monto" : "porcentaje";

  try {
    const cupon = await prisma.coupon.update({
      where: { id },
      data: {
        codigo,
        tipo,
        valor: Math.max(0, Number(data.valor) || 0),
        minimo: Math.max(0, Number(data.minimo) || 0),
        maximo: Math.max(0, Number(data.maximo) || 0),
        activo: data.activo !== false,
        vencimiento: data.vencimiento ? new Date(String(data.vencimiento)) : null,
      },
    });
    return NextResponse.json(cupon);
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "El registro no fue encontrado" }, { status: 404 });
    }
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
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "El registro no fue encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
