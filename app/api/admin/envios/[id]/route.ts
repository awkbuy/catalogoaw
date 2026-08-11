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

  const name = String(data.name || "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Ingresá un nombre para la zona de envío" },
      { status: 400 }
    );
  }

  try {
    const item = await prisma.shippingZone.update({
      where: { id },
      data: {
        name,
        cost: Math.max(0, Number(data.cost) || 0),
        freeFrom: Math.max(0, Number(data.freeFrom) || 0),
        active: data.active !== false,
        order: Math.max(0, Number(data.order) || 0),
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "El registro no fue encontrado" }, { status: 404 });
    }
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
    await prisma.shippingZone.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "El registro no fue encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
