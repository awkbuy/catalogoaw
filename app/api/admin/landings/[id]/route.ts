import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";
import { parseJsonBody, sanitizeError, isPrismaNotFound } from "@/lib/errors";
import { isReservedSlug, parseProductIds } from "@/lib/landings";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const landing = await prisma.landingPage.findUnique({ where: { id } });

  if (!landing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(landing);
}

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

  const slug = String(data.slug || "").trim();
  if (!slug) {
    return NextResponse.json({ error: "El slug es obligatorio" }, { status: 400 });
  }
  if (isReservedSlug(slug)) {
    return NextResponse.json(
      { error: "Ese slug está reservado por el sistema" },
      { status: 400 }
    );
  }

  try {
    const landing = await prisma.landingPage.update({
      where: { id },
      data: {
        slug,
        title: String(data.title || ""),
        description: String(data.description || ""),
        heroTitle: String(data.heroTitle || ""),
        heroDescription: String(data.heroDescription || ""),
        heroImage: String(data.heroImage || ""),
        bannerColor: String(data.bannerColor || "#31D3A9"),
        seoTitle: String(data.seoTitle || ""),
        seoDescription: String(data.seoDescription || ""),
        seoKeywords: String(data.seoKeywords || ""),
        canonical: String(data.canonical || ""),
        productIds: JSON.stringify(parseProductIds(data.productIds)),
        isActive: data.isActive !== false,
        sortOrder: Math.max(0, Number(data.sortOrder) || 0),
      },
    });
    return NextResponse.json(landing);
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
    await prisma.landingPage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "El registro no fue encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
