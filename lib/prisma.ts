import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(url?: string) {
  const dbUrl = url || process.env.DATABASE_URL || "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

// Cliente global (fallback para dev, DB de tenant por defecto)
export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Cache de PrismaClient por tenant (1 por request, sobrevive hot-reload en dev)
const tenantClientCache = new Map<string, PrismaClient>();

/**
 * Crea o reutiliza un PrismaClient apuntando a la DB del tenant especificado.
 * Cada tenant tiene su propio archivo SQLite en data/tenants/<tenantId>.db
 */
export function getTenantPrisma(tenantId: string): PrismaClient {
  const cached = tenantClientCache.get(tenantId);
  if (cached) return cached;

  const url = `file:./data/tenants/${tenantId}.db`;
  const client = createPrismaClient(url);
  tenantClientCache.set(tenantId, client);
  return client;
}

/**
 * Limpia el cache de clientes (útil para tests).
 */
export function clearTenantCache() {
  for (const client of tenantClientCache.values()) {
    client.$disconnect();
  }
  tenantClientCache.clear();
}

// ─────────────────────────────────────────────────────────────
// Platform client (DB global de plataforma)
// ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _platformPrisma: any = null;

/**
 * Retorna el PrismaClient de la DB de plataforma.
 * Se usa solo para operaciones de superadmin (Tenant, TenantUser, etc.)
 * Import dinámico del client generado con platform.prisma.
 */
export async function getPlatformPrisma() {
  if (_platformPrisma) return _platformPrisma;

  const { PrismaClient: PlatformPrismaClient } = await import(
    ".prisma/platform-client"
  );
  const url = process.env.PLATFORM_DATABASE_URL || "file:./data/platform.db";
  const adapter = new PrismaBetterSqlite3({ url });
  _platformPrisma = new PlatformPrismaClient({ adapter });
  return _platformPrisma;
}
