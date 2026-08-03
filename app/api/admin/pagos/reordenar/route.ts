import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids = body.ids;

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "Lista de orden inválida" }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.paymentMethod.update({
          where: { id },
          data: { orden: index + 1 },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error reordenando medios de pago" },
      { status: 500 }
    );
  }
}
