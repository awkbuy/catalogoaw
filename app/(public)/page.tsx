import { getTenantDbOrNull } from "@/lib/tenant";
import HomeClient from "./HomeClient";
import JsonLd from "@/components/JsonLd";
import { parsearHorarios } from "@/lib/horarios";
import { parseTaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import { getCuotasInfo, type PublicShippingZone } from "@/lib/ventas";
import {
  getSeoSettings,
  collectionPageJsonLd,
  faqJsonLd,
} from "@/lib/seo";

export const revalidate = 300;

export default async function Home() {
  const prisma = await getTenantDbOrNull();
  
  // Si no hay tenant resuelto, mostrar página vacía (dev local sin subdominio)
  if (!prisma) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Accedé desde tu subdominio para ver el catálogo.</p>
      </div>
    );
  }

  const [games, categories, paymentMethods, settings, shippingZones] = await Promise.all([
    prisma.game.findMany({
      include: {
        categoria: { select: { nombre: true, icono: true, color: true } },
        categorias: { select: { nombre: true, icono: true, color: true } },
      },
      orderBy: { orden: "asc" },
    }),
    prisma.category.findMany({
      include: { _count: { select: { games: true } } },
      orderBy: { orden: "asc" },
    }),
    prisma.paymentMethod.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    getSeoSettings(),
    prisma.shippingZone.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const settingsRows = await prisma.setting.findMany();
  const rawSettings: Record<string, string> = {};
  for (const s of settingsRows) {
    rawSettings[s.key] = s.value;
  }

  const whatsappNumber = rawSettings.whatsapp || rawSettings.telefono || "";
  const businessName = rawSettings.nombreNegocio || "Wolfie Room";
  const logoUrl = rawSettings.logoUrl || null;
  const direccion = rawSettings.direccion || "";
  const ciudad = rawSettings.ciudad || "";
  const taxConfig = parseTaxConfig(rawSettings);
  const cuotasInfo = getCuotasInfo(rawSettings);

  const publicPaymentMethods: PublicPaymentMethod[] = paymentMethods.map((pm) => ({
    id: pm.id,
    titulo: pm.titulo,
    descripcion: pm.descripcion,
    icono: pm.icono,
    promocional: pm.promocional,
  }));

  const publicShippingZones: PublicShippingZone[] = shippingZones.map((z) => ({
    id: z.id,
    name: z.name,
    cost: z.cost,
    freeFrom: z.freeFrom,
    consultar: z.consultar,
    active: z.active,
  }));

  const faq = faqJsonLd(settings.faq);

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd(
          settings,
          games.map((g) => ({ nombre: g.nombre, slug: g.slug }))
        )}
      />
      {faq ? <JsonLd data={faq} /> : null}
      <HomeClient
        games={games}
        categories={categories}
        whatsappNumber={whatsappNumber}
        businessName={businessName}
        logoUrl={logoUrl}
        horarios={parsearHorarios(rawSettings.horarios_semana)}
        taxConfig={taxConfig}
        paymentMethods={publicPaymentMethods}
        cuotasInfo={cuotasInfo}
        envioZonas={publicShippingZones}
        direccion={direccion}
        ciudad={ciudad}
      />
    </>
  );
}
