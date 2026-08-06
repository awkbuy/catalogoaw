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

function feedProductType(game: FeedGame): string {
  return (game.metaProductCategory || game.categoriaNombre || "").trim();
}

export function buildMetaFeedXml(
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
      const productType = feedProductType(game);
      const fields: string[] = [
        `<g:id>${xmlEscape(game.id)}</g:id>`,
        `<g:title>${xmlEscape(game.nombre)}</g:title>`,
        `<g:description>${xmlEscape(feedDescription(game))}</g:description>`,
        `<g:availability>${availabilityFor(game.disponibleVenta)}</g:availability>`,
        `<g:condition>${condition}</g:condition>`,
        `<g:price>${priceTag}</g:price>`,
        `<g:link>${xmlEscape(`${siteUrl}/juegos/${game.slug}`)}</g:link>`,
        `<g:image_link>${xmlEscape(imageUrl)}</g:image_link>`,
        `<g:brand>${xmlEscape(game.brand || "Wolfie Room")}</g:brand>`,
      ];
      if (game.gtin.trim()) fields.push(`<g:gtin>${xmlEscape(game.gtin)}</g:gtin>`);
      if (game.mpn.trim()) fields.push(`<g:mpn>${xmlEscape(game.mpn)}</g:mpn>`);
      if (productType) {
        fields.push(`<g:product_type>${xmlEscape(productType)}</g:product_type>`);
      }
      if (game.googleProductCategory.trim()) {
        fields.push(
          `<g:google_product_category>${xmlEscape(game.googleProductCategory)}</g:google_product_category>`
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
  games: FeedGame[]
): string {
  const siteUrl = getSiteUrl(settings);
  const header = META_CSV_COLUMNS.join(",");
  const rows = games.map((game) => {
    const imageUrl = resolveImage(settings, game.imagen || settings.ogImage);
    return [
      csvCell(game.id),
      csvCell(game.nombre),
      csvCell(feedDescription(game)),
      availabilityFor(game.disponibleVenta),
      conditionFor(game.condition),
      `${formatFeedPrice(feedFinalPrice(game))} ARS`,
      csvCell(`${siteUrl}/juegos/${game.slug}`),
      csvCell(imageUrl),
      csvCell(game.brand || "Wolfie Room"),
      csvCell(game.gtin.trim()),
      csvCell(game.mpn.trim()),
      csvCell(feedProductType(game)),
      csvCell(game.googleProductCategory.trim()),
    ].join(",");
  });

  return [header, ...rows].join("\n") + "\n";
}
