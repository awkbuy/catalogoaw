import { cache } from "react";
import type { Metadata } from "next";
import { getTenantDb } from "@/lib/tenant";
import { parsePrice } from "@/lib/format";

export const DEFAULT_SITE_URL = "https://catalogo.app";
export const DEFAULT_SITE_NAME = "Catalogo App";

export interface SeoFaqItem {
  pregunta: string;
  respuesta: string;
}

export interface SeoSettings {
  nombreSitio: string;
  tituloDefault: string;
  descripcion: string;
  keywords: string;
  url: string;
  canonical: string;
  idioma: string;
  pais: string;
  index: boolean;
  follow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  orgNombre: string;
  orgLogo: string;
  orgDireccion: string;
  orgCiudad: string;
  orgProvincia: string;
  orgPais: string;
  orgCodigoPostal: string;
  orgTelefono: string;
  orgEmail: string;
  googleVerification: string;
  bingVerification: string;
  faq: SeoFaqItem[];
  logoUrl: string;
  favicon: string;
  instagram: string;
  facebook: string;
  horariosSemana: string;
}

export const getSeoSettings = cache(async (): Promise<SeoSettings> => {
  const prisma = await getTenantDb();
  const rows = await prisma.setting.findMany();
  const s: Record<string, string> = {};
  for (const r of rows) {
    s[r.key] = r.value;
  }

  let faq: SeoFaqItem[] = [];
  try {
    const parsed = JSON.parse(s.seoFaq || "[]");
    if (Array.isArray(parsed)) {
      faq = parsed.filter(
        (item): item is SeoFaqItem =>
          !!item &&
          typeof item.pregunta === "string" &&
          typeof item.respuesta === "string" &&
          item.pregunta.trim() !== ""
      );
    }
  } catch {
    faq = [];
  }

  return {
    nombreSitio: s.seoNombreSitio || s.nombreNegocio || DEFAULT_SITE_NAME,
    tituloDefault:
      s.seoTitulo || `${s.nombreNegocio || DEFAULT_SITE_NAME} - Catálogo de productos`,
    descripcion:
      s.seoDescripcion ||
      s.descripcion ||
      `Descubrí el catálogo de ${
        s.nombreNegocio || DEFAULT_SITE_NAME
      } y encontrá lo que buscás para llevártelo a casa.`,
    keywords: s.seoKeywords || "",
    url: s.seoUrl || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
    canonical: s.seoCanonical || "",
    idioma: s.seoIdioma || "es_AR",
    pais: s.seoPais || "AR",
    index: s.seoIndex !== "false",
    follow: s.seoFollow !== "false",
    ogTitle: s.seoOgTitle || "",
    ogDescription: s.seoOgDescription || "",
    ogImage: s.seoOgImage || "",
    twitterCard: s.seoTwitterCard || "summary_large_image",
    twitterTitle: s.seoTwitterTitle || "",
    twitterDescription: s.seoTwitterDescription || "",
    twitterImage: s.seoTwitterImage || "",
    orgNombre: s.orgNombre || s.nombreNegocio || DEFAULT_SITE_NAME,
    orgLogo: s.orgLogo || s.logoUrl || "/images/logo.png",
    orgDireccion: s.orgDireccion || s.direccion || "",
    orgCiudad: s.orgCiudad || s.ciudad || "",
    orgProvincia: s.orgProvincia || "",
    orgPais: s.orgPais || "Argentina",
    orgCodigoPostal: s.orgCodigoPostal || "",
    orgTelefono: s.orgTelefono || s.telefono || "",
    orgEmail: s.orgEmail || s.email || "",
    googleVerification: s.googleVerification || "",
    bingVerification: s.bingVerification || "",
    faq,
    logoUrl: s.logoUrl || "/images/logo.png",
    favicon: s.favicon || "/images/favicon/favicon-32x32.png",
    instagram: s.instagram || "",
    facebook: s.facebook || "",
    horariosSemana: s.horarios_semana || "",
  };
});

export function getSiteUrl(settings: SeoSettings): string {
  const candidate = (settings.url || DEFAULT_SITE_URL).trim();
  try {
    const u = new URL(candidate);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return u.toString().replace(/\/+$/, "");
    }
  } catch {
    // valor inválido (p.ej. un link en formato Markdown): usar el default
  }
  return DEFAULT_SITE_URL;
}

export function resolveUrl(settings: SeoSettings, path: string): string {
  if (!path) return getSiteUrl(settings);
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl(settings)}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveImage(settings: SeoSettings, src: string): string {
  if (!src) return resolveUrl(settings, settings.logoUrl);
  return resolveUrl(settings, src);
}

export function buildSiteMetadata(settings: SeoSettings): Metadata {
  const siteUrl = getSiteUrl(settings);
  const siteName = settings.nombreSitio;
  let canonicalUrl: string;
  try {
    const u = new URL(settings.canonical || "", siteUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") canonicalUrl = siteUrl;
    else canonicalUrl = u.toString().replace(/\/+$/, "");
  } catch {
    canonicalUrl = siteUrl;
  }
  const ogTitle = settings.ogTitle || settings.tituloDefault;
  const ogDescription = settings.ogDescription || settings.descripcion;
  const ogImage = resolveImage(settings, settings.ogImage);
  const twitterTitle = settings.twitterTitle || ogTitle;
  const twitterDescription = settings.twitterDescription || ogDescription;
  const twitterImage = settings.twitterImage
    ? resolveImage(settings, settings.twitterImage)
    : ogImage;

  const indexable = settings.index && settings.follow;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.tituloDefault,
      template: `%s | ${siteName}`,
    },
    description: settings.descripcion,
    keywords: settings.keywords
      ? settings.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      : undefined,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    category: "catalog",
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: settings.idioma,
      url: canonicalUrl,
      title: ogTitle,
      description: ogDescription,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: settings.twitterCard as "summary" | "summary_large_image" | "app" | "player",
      title: twitterTitle,
      description: twitterDescription,
      images: [twitterImage],
    },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    verification: {
      google: settings.googleVerification || undefined,
      other: settings.bingVerification
        ? { "msvalidate.01": settings.bingVerification }
        : undefined,
    },
  };
}

export interface ProductSeoSource {
  nombre: string;
  slug: string;
  descripcion: string;
  imagen: string;
  categoriaNombre: string;
  precioFinalVenta: string;
  descuento: number;
  disponibleVenta: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonical: string;
  imagenAlt: string;
  descripcionAccesible: string;
  resumenIA: string;
  gtin: string;
  mpn: string;
  brand: string;
  condition: string;
  updatedAt?: Date | string;
}

function truncate(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}...`;
}

export function autoSeoTitle(product: ProductSeoSource): string {
  if (product.seoTitle.trim()) return product.seoTitle.trim();
  return `${product.nombre} | ${product.categoriaNombre}`;
}

export function autoSeoDescription(product: ProductSeoSource): string {
  if (product.seoDescription.trim()) return product.seoDescription.trim();
  if (product.descripcion.trim()) return truncate(product.descripcion);
  return truncate(`Descubrí ${product.nombre} en ${product.categoriaNombre}.`);
}

export function autoSeoKeywords(product: ProductSeoSource): string[] {
  if (product.seoKeywords.trim()) {
    return product.seoKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
  return [
    product.nombre,
    product.categoriaNombre,
    DEFAULT_SITE_NAME,
    "catálogo de productos",
  ].filter(Boolean);
}

export function autoImagenAlt(product: ProductSeoSource): string {
  if (product.imagenAlt.trim()) return product.imagenAlt.trim();
  if (product.descripcionAccesible.trim()) return product.descripcionAccesible.trim();
  return `${product.nombre} - ${product.categoriaNombre}`;
}

export function autoResumenIA(product: ProductSeoSource): string {
  if (product.resumenIA.trim()) return product.resumenIA.trim();
  const base = product.descripcion.trim()
    ? ` ${truncate(product.descripcion, 220)}`
    : "";
  return truncate(`${product.nombre} es un producto de la categoría ${product.categoriaNombre}.${base}`);
}

export function productUrl(settings: SeoSettings, product: ProductSeoSource): string {
  return `${getSiteUrl(settings)}/productos/${product.slug}`;
}

export function productCanonicalUrl(
  settings: SeoSettings,
  product: ProductSeoSource
): string {
  const ownUrl = productUrl(settings, product);
  const manual = (product.canonical || "").trim();
  if (!manual) return ownUrl;
  let parsed: URL;
  try {
    parsed = new URL(manual);
  } catch {
    return ownUrl;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return ownUrl;
  }
  const siteOrigin = new URL(getSiteUrl(settings)).origin;
  if (parsed.origin === siteOrigin) return ownUrl;
  return manual;
}

export function productImageUrl(
  settings: SeoSettings,
  product: ProductSeoSource
): string {
  return resolveImage(settings, product.imagen || settings.ogImage);
}

export function buildProductMetadata(
  settings: SeoSettings,
  product: ProductSeoSource
): Metadata {
  const title = autoSeoTitle(product);
  const description = autoSeoDescription(product);
  const canonical = productCanonicalUrl(settings, product);
  const image = productImageUrl(settings, product);
  const indexable = settings.index && settings.follow;

  return {
    title,
    description,
    keywords: autoSeoKeywords(product),
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: settings.idioma,
      url: canonical,
      title,
      description,
      siteName: settings.nombreSitio,
      images: [{ url: image, width: 800, height: 800, alt: autoImagenAlt(product) }],
    },
    twitter: {
      card: settings.twitterCard as "summary" | "summary_large_image" | "app" | "player",
      title: settings.twitterTitle || title,
      description: settings.twitterDescription || description,
      images: [
        settings.twitterImage
          ? resolveImage(settings, settings.twitterImage)
          : image,
      ],
    },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export interface LandingSeoSource {
  slug: string;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonical: string;
  updatedAt?: Date | string;
}

export function buildLandingMetadata(
  settings: SeoSettings,
  landing: LandingSeoSource
): Metadata {
  const title = landing.seoTitle.trim() || landing.heroTitle.trim() || landing.title;
  const description = truncate(
    landing.seoDescription.trim() ||
      landing.heroDescription.trim() ||
      landing.description ||
      landing.title
  );
  const siteUrl = getSiteUrl(settings);
  const ownUrl = `${siteUrl}/${landing.slug}`;
  const manual = (landing.canonical || "").trim();
  let canonical = ownUrl;
  if (manual) {
    try {
      const parsed = new URL(manual);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        const siteOrigin = new URL(siteUrl).origin;
        canonical = parsed.origin === siteOrigin ? ownUrl : manual;
      }
    } catch {
      canonical = ownUrl;
    }
  }
  const image = resolveImage(settings, landing.heroImage || settings.ogImage);
  const indexable = settings.index && settings.follow;
  const keywords =
    landing.seoKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean) || undefined;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: settings.idioma,
      url: canonical,
      title,
      description,
      siteName: settings.nombreSitio,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: settings.twitterCard as "summary" | "summary_large_image" | "app" | "player",
      title: settings.twitterTitle || title,
      description: settings.twitterDescription || description,
      images: [
        settings.twitterImage ? resolveImage(settings, settings.twitterImage) : image,
      ],
    },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export function organizationJsonLd(settings: SeoSettings): object {
  const siteUrl = getSiteUrl(settings);
  const sameAs = [settings.instagram, settings.facebook].filter(Boolean);
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: settings.orgNombre,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: resolveImage(settings, settings.orgLogo),
    },
  };
  if (settings.orgDireccion || settings.orgCiudad) {
    org.address = {
      "@type": "PostalAddress",
      streetAddress: settings.orgDireccion || undefined,
      addressLocality: settings.orgCiudad || undefined,
      addressRegion: settings.orgProvincia || undefined,
      postalCode: settings.orgCodigoPostal || undefined,
      addressCountry: settings.orgPais || undefined,
    };
  }
  if (settings.orgTelefono) org.telephone = settings.orgTelefono;
  if (settings.orgEmail) org.email = settings.orgEmail;
  if (sameAs.length > 0) org.sameAs = sameAs;
  return org;
}

export function localBusinessJsonLd(
  settings: SeoSettings,
  openingHours?: { dias: number[]; apertura: string; cierre: string }[]
): object | null {
  const siteUrl = getSiteUrl(settings);
  const business: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#local-business`,
    name: settings.orgNombre,
    url: siteUrl,
    priceRange: "$$",
  };
  if (settings.orgDireccion || settings.orgCiudad) {
    business.address = {
      "@type": "PostalAddress",
      streetAddress: settings.orgDireccion || undefined,
      addressLocality: settings.orgCiudad || undefined,
      addressRegion: settings.orgProvincia || undefined,
      postalCode: settings.orgCodigoPostal || undefined,
      addressCountry: settings.orgPais || undefined,
    };
  }
  if (settings.orgTelefono) business.telephone = settings.orgTelefono;
  if (settings.orgEmail) business.email = settings.orgEmail;
  if (openingHours && openingHours.length > 0) {
    const daysMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const valid = openingHours.filter((o) => o.dias.length > 0);
    if (valid.length > 0) {
      business.openingHoursSpecification = valid.map((o) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: o.dias.map((d) => daysMap[d] || daysMap[0]),
        opens: o.apertura,
        closes: o.cierre,
      }));
    }
  }
  return business;
}

export function websiteJsonLd(settings: SeoSettings): object {
  const siteUrl = getSiteUrl(settings);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: settings.nombreSitio,
    description: settings.descripcion,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: settings.idioma,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

const CONDITION_MAP: Record<string, string> = {
  new: "NewCondition",
  used: "UsedCondition",
  refurbished: "RefurbishedCondition",
};

export function productJsonLd(
  settings: SeoSettings,
  product: ProductSeoSource
): object {
  const condition = CONDITION_MAP[product.condition] || "NewCondition";
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    url: productUrl(settings, product),
    description: autoSeoDescription(product),
    image: [productImageUrl(settings, product)],
    brand: {
      "@type": "Brand",
      name: product.brand || settings.orgNombre,
    },
    category: product.categoriaNombre,
    sku: product.slug,
    mpn: product.mpn || product.slug,
    gtin13: product.gtin || undefined,
    condition,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Categoría", value: product.categoriaNombre },
    ],
  };
  const precio = parsePrice(product.precioFinalVenta);
  if (precio > 0) {
    const precioFinal =
      product.descuento > 0 ? precio * (1 - product.descuento / 100) : precio;
    jsonLd.offers = {
      "@type": "Offer",
      url: productUrl(settings, product),
      price: precioFinal.toFixed(2),
      priceCurrency: "ARS",
      priceValidUntil: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 30
      ).toISOString().slice(0, 10),
      availability: product.disponibleVenta
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: `https://schema.org/${condition}`,
      seller: {
        "@type": "Organization",
        name: settings.orgNombre,
      },
    };
  }
  return jsonLd;
}

export function collectionPageJsonLd(
  settings: SeoSettings,
  products: { nombre: string; slug: string }[]
): object {
  const siteUrl = getSiteUrl(settings);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${settings.nombreSitio} - Catálogo de productos`,
    url: siteUrl,
    description: settings.descripcion,
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.nombre,
        url: `${siteUrl}/productos/${product.slug}`,
      })),
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(faq: SeoFaqItem[]): object | null {
  if (!faq || faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.pregunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.respuesta,
      },
    })),
  };
}

export function toJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027");
}
