import { headers } from "next/headers";
import { getTenantPrisma, prisma } from "./prisma";
import type { PrismaClient } from "@prisma/client";

const HEADER_TENANT_ID = "x-tenant-id";
const HEADER_TENANT_SLUG = "x-tenant-slug";

/**
 * Resuelve el tenant actual desde los headers seteados por el proxy.
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
 * En dev/standalone sin tenant, retorna un id por defecto (para la DB local).
 * Lanza error solo si es un deploy multi-tenant estricto sin tenant resuelto.
 */
export async function requireTenantId(): Promise<string> {
  const ctx = await getTenantFromHeaders();
  if (ctx) return ctx.tenantId;
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_SINGLE_TENANT === "true"
  ) {
    return "standalone";
  }
  throw new Error(
    "No se resolvió el tenant. Asegurate de acceder desde un subdominio de tenant."
  );
}

/**
 * Retorna el tenantSlug actual desde los headers.
 * En dev/standalone sin tenant, retorna "local".
 */
export async function requireTenantSlug(): Promise<string> {
  const ctx = await getTenantFromHeaders();
  if (ctx) return ctx.tenantSlug;
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_SINGLE_TENANT === "true"
  ) {
    return "local";
  }
  throw new Error("No se resolvió el tenant.");
}

/**
 * Retorna un PrismaClient apuntando a la DB del tenant actual.
 * En dev mode sin subdominio, retorna el prisma por defecto (dev.db).
 */
export async function getTenantDb(): Promise<PrismaClient> {
  const ctx = await getTenantFromHeaders();
  if (ctx) {
    return getTenantPrisma(ctx.tenantId);
  }
  // Fallback: usar la DB por defecto (dev.db / standalone).
  // En modo standalone (una instancia de catálogo sin subdominio de tenant)
  // la app usa su propia base; solo se exige subdominio si el deploy
  // es explícitamente multi-tenant (env ALLOW_SINGLE_TENANT != "true").
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_SINGLE_TENANT === "true"
  ) {
    return prisma;
  }
  throw new Error(
    "No se resolvió el tenant. Accedé desde un subdominio de tenant."
  );
}

/**
 * Intenta obtener el PrismaClient del tenant actual.
 * Retorna null si no hay tenant resuelto (para rutas públicas que pueden no tener tenant).
 */
export async function getTenantDbOrNull(): Promise<PrismaClient | null> {
  const ctx = await getTenantFromHeaders();
  if (!ctx) {
    // En dev o standalone, retornar el prisma por defecto
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_SINGLE_TENANT === "true"
    ) {
      return prisma;
    }
    return null;
  }
  return getTenantPrisma(ctx.tenantId);
}
