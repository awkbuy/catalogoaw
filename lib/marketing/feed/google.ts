import type { SeoSettings } from "@/lib/seo";
import { getSiteUrl, resolveImage } from "@/lib/seo";
import {
  availabilityFor,
  conditionFor,
  feedDescription,
  feedFinalPrice,
  formatFeedPrice,
  xmlEscape,
  type FeedGame,
} from "./utils";

export function buildGoogleFeedXml(
  settings: SeoSettings,
  games: FeedGame[]
): string {
  const siteUrl = getSiteUrl(settings);
  const items = games
    .map((game) => {
      const price = feedFinalPrice(game);
      const priceTag = `${formatFeedPrice(price)} ARS`;
      const imageUrl = resolveImage(settings, game.imagen || settings.ogImage);
      const condition = conditionFor(game.condition);
      const fields: string[] = [
        `<g:id>${xmlEscape(game.id)}</g:id>`,
        `<g:title>${xmlEscape(game.nombre)}</g:title>`,
        `<g:description>${xmlEscape(feedDescription(game))}</g:description>`,
        `<g:link>${xmlEscape(`${siteUrl}/juegos/${game.slug}`)}</g:link>`,
        `<g:image_link>${xmlEscape(imageUrl)}</g:image_link>`,
        `<g:price>${priceTag}</g:price>`,
        `<g:availability>${availabilityFor(game.disponibleVenta)}</g:availability>`,
        `<g:condition>${condition}</g:condition>`,
        `<g:brand>${xmlEscape(game.brand || "Wolfie Room")}</g:brand>`,
      ];
      if (game.gtin.trim()) fields.push(`<g:gtin>${xmlEscape(game.gtin)}</g:gtin>`);
      if (game.mpn.trim()) fields.push(`<g:mpn>${xmlEscape(game.mpn)}</g:mpn>`);
      if (game.googleProductCategory.trim()) {
        fields.push(
          `<g:google_product_category>${xmlEscape(game.googleProductCategory)}</g:google_product_category>`
        );
      }
      if (game.categoriaNombre.trim()) {
        fields.push(
          `<g:product_type>${xmlEscape(game.categoriaNombre)}</g:product_type>`
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
