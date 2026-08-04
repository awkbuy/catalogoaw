"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function getSettings(): Promise<Record<string, string>> {
  await requireAuth();
  
  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }
  return result;
}

export async function updateSettings(data: Record<string, string>) {
  await requireAuth();

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
