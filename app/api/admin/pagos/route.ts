import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, sanitizeError } from "@/lib/errors";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.paymentMethod.findMany({ orderBy: { orden: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

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
    revalidatePath("/");
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
