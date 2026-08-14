import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminPath, isAdminPath } from "@/lib/admin-path";

const HEADER_TENANT_ID = "x-tenant-id";
const HEADER_TENANT_SLUG = "x-tenant-slug";

// Cache de resolución de tenant por slug (TTL 5 min)
const tenantCache = new Map<string, { id: string; slug: string; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Client singleton para platform DB
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _platformDb: any = null;

async function getPlatformDb() {
  if (_platformDb) return _platformDb;

  const { PrismaClient } = await import(".prisma/platform-client");
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  const url = process.env.PLATFORM_DATABASE_URL || "file:./data/platform.db";
  const adapter = new PrismaBetterSqlite3({ url });
  _platformDb = new PrismaClient({ adapter });
  return _platformDb;
}

/**
 * Resuelve el tenant por slug, con cache en memoria.
 */
async function resolveTenant(
  slug: string
): Promise<{ id: string; slug: string } | null> {
  const cached = tenantCache.get(slug);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { id: cached.id, slug: cached.slug };
  }

  try {
    const db = await getPlatformDb();
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, estado: true },
    });

    if (!tenant || tenant.estado !== "active") {
      tenantCache.delete(slug);
      return null;
    }

    tenantCache.set(slug, { id: tenant.id, slug: tenant.slug, ts: Date.now() });
    return { id: tenant.id, slug: tenant.slug };
  } catch {
    return null;
  }
}

/**
 * Resuelve un dominio personalizado al tenant correspondiente.
 */
async function resolveCustomDomain(
  domain: string
): Promise<{ id: string; slug: string } | null> {
  try {
    const db = await getPlatformDb();
    const d = await db.domain.findUnique({
      where: { domain },
      select: {
        tenantId: true,
        tenant: { select: { id: true, slug: true, estado: true } },
      },
    });

    if (!d || !d.tenant || d.tenant.estado !== "active") return null;
    return { id: d.tenant.id, slug: d.tenant.slug };
  } catch {
    return null;
  }
}

/**
 * Intenta resolver el tenant desde el hostname.
 * Retorna headers x-tenant-id y x-tenant-slug si se resuelve.
 */
async function resolveTenantFromHost(
  host: string
): Promise<{ id: string; slug: string } | null> {
  const platformDomain = process.env.PLATFORM_DOMAIN || "catalogoaw.com";

  // Dominio raíz de plataforma → sin tenant
  if (host === platformDomain) return null;

  // Subdominio de plataforma (ej. wolfie.catalogoaw.com)
  if (host.endsWith(`.${platformDomain}`)) {
    const slug = host.replace(`.${platformDomain}`, "");
    if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
      return resolveTenant(slug);
    }
    return null;
  }

  // Dominio personalizado (solo si no es IP ni localhost)
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && host !== "localhost") {
    return resolveCustomDomain(host);
  }

  return null;
}

/**
 * Rutas públicas que comparten segmento inicial con rutas admin:
 * /productos/[slug] es la página pública de detalle, mientras que
 * /productos/new y /productos/editar/* son subpaths exclusivos del panel.
 */
function isPublicDetailPath(pathname: string): boolean {
  if (!/^\/productos\/[^/]+$/.test(pathname)) return false;
  const rest = pathname.slice("/productos/".length);
  return rest !== "new" && !rest.startsWith("editar");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPath = getAdminPath();

  // ── Tenant resolution por subdominio/dominio ──
  const hostname = request.headers.get("host") || "";
  const host = hostname.split(":")[0];
  const tenant = await resolveTenantFromHost(host);

  // Si el dominio resuelve a un tenant pero no existe → 404
  const platformDomain = process.env.PLATFORM_DOMAIN || "catalogoaw.com";
  const isPlatformDomain =
    host === platformDomain ||
    host.endsWith(`.${platformDomain}`);
  const isCustomDomain =
    !/^\d{1,3}(\.\d{1,3}){3}$/.test(host) &&
    host !== "localhost" &&
    !isPlatformDomain;

  if ((isPlatformDomain && host !== platformDomain && !tenant) ||
      (isCustomDomain && !tenant)) {
    return new NextResponse("Tenant no encontrado", { status: 404 });
  }

  // Crear response con headers de tenant
  const headers = new Headers(request.headers);
  if (tenant) {
    headers.set(HEADER_TENANT_ID, tenant.id);
    headers.set(HEADER_TENANT_SLUG, tenant.slug);
  }

  // ── Admin path rewrite ──
  if (adminPath) {
    const prefix = `/${adminPath}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const internal = pathname === prefix ? "/" : pathname.slice(prefix.length);
      const url = request.nextUrl.clone();
      url.pathname = internal;
      const response = NextResponse.rewrite(url, { request: { headers } });
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      if (tenant) {
        response.headers.set(HEADER_TENANT_ID, tenant.id);
        response.headers.set(HEADER_TENANT_SLUG, tenant.slug);
      }
      return response;
    }

    if (isAdminPath(pathname) && !isPublicDetailPath(pathname)) {
      return new NextResponse(null, { status: 404 });
    }
  } else if (isAdminPath(pathname)) {
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (tenant) {
      response.headers.set(HEADER_TENANT_ID, tenant.id);
      response.headers.set(HEADER_TENANT_SLUG, tenant.slug);
    }
    return response;
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!api|_next/|uploads/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|avif|svg|gif|ico|css|js|mjs|json|woff|woff2|ttf|otf|eot)).*)",
  ],
};
