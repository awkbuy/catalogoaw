import JsonLd from "@/components/JsonLd";
import {
  getSeoSettings,
  organizationJsonLd,
  localBusinessJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { parsearHorarios } from "@/lib/horarios";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSeoSettings();
  const horarios = parsearHorarios(settings.horariosSemana);
  const openingHours = horarios
    .filter((h) => h.abierto)
    .map((h) => ({ dias: [h.dia], apertura: h.apertura, cierre: h.cierre }));
  const localBusiness = localBusinessJsonLd(settings, openingHours);

  return (
    <>
      <JsonLd data={organizationJsonLd(settings)} />
      <JsonLd data={websiteJsonLd(settings)} />
      {localBusiness ? <JsonLd data={localBusiness} /> : null}
      {children}
    </>
  );
}
