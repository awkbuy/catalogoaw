const RESERVED_SLUGS = new Set([
  "login",
  "dashboard",
  "games",
  "categories",
  "cupones",
  "pagos",
  "horarios",
  "seo",
  "settings",
  "account",
  "landings",
  "productos",
  "api",
]);

export function slugifyLanding(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim());
}

export function parseProductIds(raw: unknown): string[] {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (v): v is string => typeof v === "string" && v.length > 0
        );
      }
    } catch {
      return [];
    }
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === "string" && v.length > 0);
  }
  return [];
}
