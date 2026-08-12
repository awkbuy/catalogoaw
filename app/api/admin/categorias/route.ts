import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";
import { parseJsonBody, sanitizeError } from "@/lib/errors";

export async function GET() {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categorias = await prisma.category.findMany({
    include: { _count: { select: { games: true } } },
    orderBy: { orden: "asc" },
  });

  return NextResponse.json(categorias);
}

export async function POST(req: NextRequest) {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  try {
    const categoria = await prisma.category.create({
      data: {
        nombre: String(data.nombre || ""),
        icono: data.icono ? String(data.icono) : undefined,
        color: data.color ? String(data.color) : "#31D3A9",
        tags: data.tags ? String(data.tags) : "",
        orden: Math.max(0, Number(data.orden) || 0),
      },
    });
    revalidatePath("/");
    return NextResponse.json(categoria);
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
