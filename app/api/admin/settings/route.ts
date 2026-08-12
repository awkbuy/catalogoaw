import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";
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
  "logo",
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
  // Ventas (Fase 2)
  "cuotasHabilitadas",
  "cuotasMax",
  "cuotasInteresMensual",
  "cuotasMinimoPrecio",
  // Popup de captura de email (Fase 4)
  "popupEnabled",
  "popupImage",
  "popupTitle",
  "popupText",
  "popupDelaySeconds",
  // Cintillo (Fase 5)
  "announcementEnabled",
  "announcementText",
];

export async function GET() {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.setting.findMany();
  const data: Record<string, string> = {};
  for (const s of settings) {
    data[s.key] = s.value;
  }
  data.metaAccessTokenConfigured = process.env.META_ACCESS_TOKEN ? "true" : "false";
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const invalidKeys = Object.keys(data).filter(
    (key) => !ALLOWED_SETTINGS_KEYS.includes(key) && key !== "metaAccessTokenConfigured"
  );
  if (invalidKeys.length > 0) {
    return NextResponse.json(
      { error: "Invalid settings keys" },
      { status: 400 }
    );
  }

  try {
    for (const [key, value] of Object.entries(data)) {
      // metaAccessTokenConfigured es derivado (env del servidor), nunca se persiste
      if (key === "metaAccessTokenConfigured") continue;
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value ?? "") },
        create: { key, value: String(value ?? "") },
      });
    }
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error saving settings" },
      { status: 500 }
    );
  }
}
