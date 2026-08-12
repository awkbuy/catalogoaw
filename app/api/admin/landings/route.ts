import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";
import { parseJsonBody, sanitizeError } from "@/lib/errors";
import { isReservedSlug, parseGameIds } from "@/lib/landings";

export async function GET() {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const landings = await prisma.landingPage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(landings);
}

export async function POST(req: NextRequest) {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const landing = await prisma.landingPage.create({
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
        gameIds: JSON.stringify(parseGameIds(data.gameIds)),
        isActive: data.isActive !== false,
        sortOrder: Math.max(0, Number(data.sortOrder) || 0),
      },
    });
    return NextResponse.json(landing);
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
