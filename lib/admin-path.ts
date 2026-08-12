function normalize(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

export function getAdminPath(): string {
  return normalize(
    process.env.NEXT_PUBLIC_ADMIN_PATH || process.env.ADMIN_PATH || ""
  );
}

export function adminHref(path: string, prefix?: string): string {
  const p = prefix === undefined ? getAdminPath() : normalize(prefix);
  if (!p) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${p}${clean}`;
}

export const ADMIN_ROUTES = [
  "/login",
  "/dashboard",
  "/games",
  "/categories",
  "/landings",
  "/cupones",
  "/pagos",
  "/envios",
  "/horarios",
  "/seo",
  "/settings",
  "/account",
  "/marketing",
];

export function isAdminPath(pathname: string): boolean {
  return ADMIN_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
