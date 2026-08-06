import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/errors";

const ALLOWED_SETTINGS_KEYS = [
  // Página Configuración (/settings)
  "nombre",
  "descripcion",
  "telefono",
  "email",
  "direccion",
  "ciudad",
  "horario",
  "horarios",
  "horarios_semana",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "whatsapp",
  "iva",
  "otrosImpuestosNacionales",
  "activoCalculoAutomatico",
  "mostrarPrecioSinImpuestos",
  "logoUrl",
  "favicon",
  "nombreNegocio",
  "descripcionHero",
  "tituloHero",
  "textoCTA",
  "urlMaps",
  // Página SEO (/seo)
  "seoNombreSitio",
  "seoTitulo",
  "seoDescripcion",
  "seoKeywords",
  "seoUrl",
  "seoCanonical",
  "seoIdioma",
  "seoPais",
  "seoIndex",
  "seoFollow",
  "seoOgTitle",
  "seoOgDescription",
  "seoOgImage",
  "seoTwitterCard",
  "seoTwitterTitle",
  "seoTwitterDescription",
  "seoTwitterImage",
  "seoFaq",
  "orgNombre",
  "orgLogo",
  "orgDireccion",
  "orgCiudad",
  "orgProvincia",
  "orgPais",
  "orgCodigoPostal",
  "orgTelefono",
  "orgEmail",
  "googleVerification",
  "bingVerification",
  // Claves históricas / migración de diseño anterior
  "businessName",
  "businessSlogan",
  "whatsappNumber",
  "address",
  "city",
  "province",
  "postalCode",
  "heroTitle",
  "heroSubtitle",
  "heroButtonText",
  "heroButtonLink",
  "categoriesHeroTitle",
  "categoriesHeroSubtitle",
  "featuredProductsTitle",
  "featuredProductsSubtitle",
  "featuredCategoryId",
  "catalogTitle",
  "catalogSubtitle",
  "catalogHeroImage",
  "ga4MeasurementId",
  // Integraciones de marketing (Fase 3)
  "ga4Enabled",
  "ga4PropertyId",
  "ga4ServiceAccountEmail",
  "metaPixelId",
  "metaTestEventCode",
  "metaBusinessId",
  "metaCatalogId",
  "metaPixelEnabled",
  "metaCapiEnabled",
  "clarityProjectId",
  "clarityEnabled",
  "paymentLink",
  "bankTransferAlias",
  "bankTransferCbu",
];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.setting.findMany();
  const data: Record<string, string> = {};
  for (const s of settings) {
    data[s.key] = s.value;
  }
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const invalidKeys = Object.keys(data).filter(
    (key) => !ALLOWED_SETTINGS_KEYS.includes(key)
  );
  if (invalidKeys.length > 0) {
    return NextResponse.json(
      { error: "Invalid settings keys" },
      { status: 400 }
    );
  }

  try {
    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value ?? "") },
        create: { key, value: String(value ?? "") },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error saving settings" },
      { status: 500 }
    );
  }
}
