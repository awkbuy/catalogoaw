import { headers } from "next/headers";
import { getTenantPrisma } from "./prisma";
import type { PrismaClient } from "@prisma/client";

const HEADER_TENANT_ID = "x-tenant-id";
const HEADER_TENANT_SLUG = "x-tenant-slug";

/**
 * Resuelve el tenant actual desde los headers seteados por el middleware.
 * Retorna { tenantId, tenantSlug } o null si no hay tenant.
 */
export async function getTenantFromHeaders(): Promise<{
  tenantId: string;
  tenantSlug: string;
} | null> {
  const h = await headers();
  const tenantId = h.get(HEADER_TENANT_ID);
  const tenantSlug = h.get(HEADER_TENANT_SLUG);
  if (!tenantId || !tenantSlug) return null;
  return { tenantId, tenantSlug };
}

/**
 * Retorna el tenantId actual desde los headers.
 * Lanza error si no hay tenant resuelto (para uso en server actions/admin).
 */
export async function requireTenantId(): Promise<string> {
  const ctx = await getTenantFromHeaders();
  if (!ctx) {
    throw new Error(
      "No se resolvió el tenant. Asegurate de acceder desde un subdominio de tenant."
    );
  }
  return ctx.tenantId;
}

/**
 * Retorna el tenantSlug actual desde los headers.
 */
export async function requireTenantSlug(): Promise<string> {
  const ctx = await getTenantFromHeaders();
  if (!ctx) {
    throw new Error("No se resolvió el tenant.");
  }
  return ctx.tenantSlug;
}

/**
 * Retorna un PrismaClient apuntando a la DB del tenant actual.
 * Útil para server components y server actions que necesitan datos del catálogo.
 */
export async function getTenantDb(): Promise<PrismaClient> {
  const tenantId = await requireTenantId();
  return getTenantPrisma(tenantId);
}

/**
 * Intenta obtener el PrismaClient del tenant actual.
 * Retorna null si no hay tenant resuelto (para rutas públicas que pueden no tener tenant).
 */
export async function getTenantDbOrNull(): Promise<PrismaClient | null> {
  const ctx = await getTenantFromHeaders();
  if (!ctx) return null;
  return getTenantPrisma(ctx.tenantId);
}
