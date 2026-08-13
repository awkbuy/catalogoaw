"use server";

import { requireAuth } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";

export async function getPublicBrand(): Promise<{
  nombreNegocio: string;
  logoUrl: string | null;
}> {
  const prisma = await getTenantDb();
  const [nombreNegocio, logoUrl] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "nombreNegocio" } }),
    prisma.setting.findUnique({ where: { key: "logoUrl" } }),
  ]);
  return {
    nombreNegocio: nombreNegocio?.value || "Catalogo App",
    logoUrl: logoUrl?.value || null,
  };
}

export async function getSettings(): Promise<Record<string, string>> {
  await requireAuth();
  const prisma = await getTenantDb();
  
  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }
  return result;
}

export async function updateSettings(data: Record<string, string>) {
  await requireAuth();
  const prisma = await getTenantDb();

  const updates = Object.entries(data).map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  );

  await prisma.$transaction(updates);
  return { success: true };
}
