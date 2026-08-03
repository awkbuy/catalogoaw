import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const original = await prisma.game.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id: _, createdAt: __, updatedAt: ___, ...rest } = original;
  void _; void __; void ___;

  const duplicate = await prisma.game.create({
    data: {
      ...rest,
      nombre: `${rest.nombre} (copia)`,
      slug: `${rest.slug}-copia-${Date.now()}`,
    },
  });

  return NextResponse.json(duplicate);
}
