import type { SeoSettings } from "@/lib/seo";
import { getSiteUrl, resolveImage } from "@/lib/seo";
import {
  availabilityFor,
  conditionFor,
  feedDescription,
  feedFinalPrice,
  formatFeedPrice,
  xmlEscape,
  type FeedProduct,
} from "./utils";

function feedProductType(product: FeedProduct): string {
  return (product.metaProductCategory || product.categoriaNombre || "").trim();
}

export function buildMetaFeedXml(
  settings: SeoSettings,
  products: FeedProduct[]
): string {
  const siteUrl = getSiteUrl(settings);
  const items = products
    .map((product) => {
      const price = feedFinalPrice(product);
      const priceTag = `${formatFeedPrice(price)} ARS`;
      const imageUrl = resolveImage(settings, product.imagen || settings.ogImage);
      const condition = conditionFor(product.condition);
      const productType = feedProductType(product);
      const fields: string[] = [
        `<g:id>${xmlEscape(product.id)}</g:id>`,
        `<g:title>${xmlEscape(product.nombre)}</g:title>`,
        `<g:description>${xmlEscape(feedDescription(product))}</g:description>`,
        `<g:availability>${availabilityFor(product.disponibleVenta)}</g:availability>`,
        `<g:condition>${condition}</g:condition>`,
        `<g:price>${priceTag}</g:price>`,
        `<g:link>${xmlEscape(`${siteUrl}/productos/${product.slug}`)}</g:link>`,
        `<g:image_link>${xmlEscape(imageUrl)}</g:image_link>`,
        `<g:brand>${xmlEscape(product.brand || "Catalogo App")}</g:brand>`,
      ];
      if (product.gtin.trim()) fields.push(`<g:gtin>${xmlEscape(product.gtin)}</g:gtin>`);
      if (product.mpn.trim()) fields.push(`<g:mpn>${xmlEscape(product.mpn)}</g:mpn>`);
      if (productType) {
        fields.push(`<g:product_type>${xmlEscape(productType)}</g:product_type>`);
      }
      if (product.googleProductCategory.trim()) {
        fields.push(
          `<g:google_product_category>${xmlEscape(product.googleProductCategory)}</g:google_product_category>`
        );
      }
      return `<item>\n${fields.map((f) => `      ${f}`).join("\n")}\n    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(settings.nombreSitio)}</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>${xmlEscape(settings.descripcion)}</description>
    ${items}
  </channel>
</rss>
`;
}

export const META_CSV_COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "gtin",
  "mpn",
  "product_type",
  "google_product_category",
] as const;

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildMetaFeedCsv(
  settings: SeoSettings,
  products: FeedProduct[]
): string {
  const siteUrl = getSiteUrl(settings);
  const header = META_CSV_COLUMNS.join(",");
  const rows = products.map((product) => {
    const imageUrl = resolveImage(settings, product.imagen || settings.ogImage);
    return [
      csvCell(product.id),
      csvCell(product.nombre),
      csvCell(feedDescription(product)),
      availabilityFor(product.disponibleVenta),
      conditionFor(product.condition),
      `${formatFeedPrice(feedFinalPrice(product))} ARS`,
      csvCell(`${siteUrl}/productos/${product.slug}`),
      csvCell(imageUrl),
      csvCell(product.brand || "Catalogo App"),
      csvCell(product.gtin.trim()),
      csvCell(product.mpn.trim()),
      csvCell(feedProductType(product)),
      csvCell(product.googleProductCategory.trim()),
    ].join(",");
  });

  return [header, ...rows].join("\n") + "\n";
}
