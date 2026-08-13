import { parsePrice } from "@/lib/format";

export type FeedAvailability = "in stock" | "out of stock" | "preorder" | "backorder";
export type FeedCondition = "new" | "refurbished" | "used";

export const FEED_CONDITIONS: readonly FeedCondition[] = [
  "new",
  "refurbished",
  "used",
];

export interface FeedProduct {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  seoDescription: string;
  imagen: string;
  categoriaNombre: string;
  precioFinalVenta: string;
  descuento: number;
  disponibleVenta: boolean;
  showInMerchant: boolean;
  showInMetaCommerce: boolean;
  googleProductCategory: string;
  metaProductCategory: string;
  gtin: string;
  mpn: string;
  brand: string;
  condition: string;
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function feedDescription(product: FeedProduct): string {
  const source = (product.seoDescription || product.descripcion || "").trim();
  const clean = stripHtml(source);
  return clean.length > 1000 ? `${clean.slice(0, 997)}...` : clean;
}

export function feedFinalPrice(product: FeedProduct): number {
  const base = parsePrice(product.precioFinalVenta);
  if (base <= 0) return 0;
  const discount = Math.max(0, Math.min(100, product.descuento || 0));
  if (discount <= 0) return Math.round(base * 100) / 100;
  return Math.round(base * (1 - discount / 100) * 100) / 100;
}

export function formatFeedPrice(value: number): string {
  return value.toFixed(2);
}

export function availabilityFor(disponibleVenta: boolean): FeedAvailability {
  return disponibleVenta ? "in stock" : "out of stock";
}

export function conditionFor(condition: string): FeedCondition {
  const normalized = (condition || "new").trim().toLowerCase();
  return (FEED_CONDITIONS as readonly string[]).includes(normalized)
    ? (normalized as FeedCondition)
    : "new";
}
