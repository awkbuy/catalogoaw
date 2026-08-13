import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";
import { parseJsonBody, sanitizeError } from "@/lib/errors";

export async function GET() {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const productos = await prisma.product.findMany({
    include: {
      categoria: { select: { nombre: true, color: true } },
      categorias: { select: { id: true, nombre: true, color: true } },
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  try {
    const categoriaIds = parseCategoriaIds(data);
    const producto = await prisma.product.create({
      data: {
        nombre: String(data.nombre || ""),
        slug: String(data.slug || ""),
        descripcion: String(data.descripcion || ""),
        categoriaId: String(data.categoriaId || ""),
        categorias: { connect: categoriaIds.map((id) => ({ id })) },
        precioFinalVenta: String(data.precioFinalVenta || ""),
        descuento: Math.max(0, Number(data.descuento) || 0),
        envioGratis: data.envioGratis === true,
        imagen: String(data.imagen || ""),
        integrarVideo: data.integrarVideo === true,
        videoUrl: String(data.videoUrl || ""),
        estado: String(data.estado || "Disponible"),
        destacado: data.destacado === true,
        nuevo: data.nuevo === true,
        disponibleVenta: data.disponibleVenta === true,
        orden: Math.max(0, Number(data.orden) || 0),
        seoTitle: String(data.seoTitle || ""),
        seoDescription: String(data.seoDescription || ""),
        seoKeywords: String(data.seoKeywords || ""),
        canonical: String(data.canonical || ""),
        imagenAlt: String(data.imagenAlt || ""),
        descripcionAccesible: String(data.descripcionAccesible || ""),
        resumenIA: String(data.resumenIA || ""),
        showInMerchant: data.showInMerchant === true,
        showInMetaCommerce: data.showInMetaCommerce === true,
        allowDynamicAds: data.allowDynamicAds === true,
        marketingFeatured: data.marketingFeatured === true,
        remarketingEligible: data.remarketingEligible === true,
        googleProductCategory: String(data.googleProductCategory || ""),
        metaProductCategory: String(data.metaProductCategory || ""),
        gtin: String(data.gtin || ""),
        mpn: String(data.mpn || ""),
        brand: String(data.brand || "Catalogo App"),
        condition: String(data.condition || "new"),
        marketingPriority: Math.max(0, Number(data.marketingPriority) || 0),
      },
    });
    revalidatePath("/");
    return NextResponse.json(producto);
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}

function parseCategoriaIds(data: Record<string, unknown>): string[] {
  const raw = data.categoriaIds;
  const ids = Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  const primary = String(data.categoriaId || "");
  const all = new Set<string>();
  if (primary) all.add(primary);
  for (const id of ids) all.add(id);
  return [...all];
}
