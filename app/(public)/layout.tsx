import JsonLd from "@/components/JsonLd";
import {
  getSeoSettings,
  organizationJsonLd,
  localBusinessJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { parsearHorarios } from "@/lib/horarios";
import { getPromoConfig } from "@/lib/promo";
import EmailPopup from "@/components/EmailPopup";
import AnnouncementBar from "@/components/AnnouncementBar";

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
  const promo = await getPromoConfig();

  return (
    <>
      <JsonLd data={organizationJsonLd(settings)} />
      <JsonLd data={websiteJsonLd(settings)} />
      {localBusiness ? <JsonLd data={localBusiness} /> : null}
      {children}
      {promo.announcementEnabled && promo.announcementText.trim() ? (
        <AnnouncementBar text={promo.announcementText} />
      ) : null}
      {promo.popupEnabled ? <EmailPopup config={promo} /> : null}
    </>
  );
}
