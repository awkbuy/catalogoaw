import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";
import { parseJsonBody, sanitizeError, isPrismaNotFound } from "@/lib/errors";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  try {
    const categoria = await prisma.category.update({
      where: { id },
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
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const count = await prisma.product.count({ where: { categoriaId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: hay ${count} productos asignados a esta categoría` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "El registro no fue encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
