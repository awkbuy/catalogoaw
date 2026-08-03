"use server";

import { redirect } from "next/navigation";
import { compareSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/auth";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | never> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Credenciales inválidas" };
  }

  const valid = compareSync(password, user.passwordHash);
  if (!valid) {
    return { error: "Credenciales inválidas" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<never> {
  await deleteSession();
  redirect("/login");
}
