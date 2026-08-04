"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashSync, compareSync } from "bcryptjs";

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success?: boolean; error?: string }> {
  const userId = await requireAuth();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: "Usuario no encontrado" };
  }

  const valid = compareSync(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "La contraseña actual es incorrecta" };
  }

  if (newPassword.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashSync(newPassword, 10) },
  });

  return { success: true };
}