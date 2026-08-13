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

export function buildGoogleFeedXml(
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
      const fields: string[] = [
        `<g:id>${xmlEscape(product.id)}</g:id>`,
        `<g:title>${xmlEscape(product.nombre)}</g:title>`,
        `<g:description>${xmlEscape(feedDescription(product))}</g:description>`,
        `<g:link>${xmlEscape(`${siteUrl}/productos/${product.slug}`)}</g:link>`,
        `<g:image_link>${xmlEscape(imageUrl)}</g:image_link>`,
        `<g:price>${priceTag}</g:price>`,
        `<g:availability>${availabilityFor(product.disponibleVenta)}</g:availability>`,
        `<g:condition>${condition}</g:condition>`,
        `<g:brand>${xmlEscape(product.brand || "Catalogo App")}</g:brand>`,
      ];
      if (product.gtin.trim()) fields.push(`<g:gtin>${xmlEscape(product.gtin)}</g:gtin>`);
      if (product.mpn.trim()) fields.push(`<g:mpn>${xmlEscape(product.mpn)}</g:mpn>`);
      if (product.googleProductCategory.trim()) {
        fields.push(
          `<g:google_product_category>${xmlEscape(product.googleProductCategory)}</g:google_product_category>`
        );
      }
      if (product.categoriaNombre.trim()) {
        fields.push(
          `<g:product_type>${xmlEscape(product.categoriaNombre)}</g:product_type>`
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
