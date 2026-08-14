"use server";

import { redirect } from "next/navigation";
import { compareSync } from "bcryptjs";
import { headers } from "next/headers";
import { createSession, deleteSession } from "@/lib/auth";
import { adminHref } from "@/lib/admin-path";
import { rateLimit } from "@/lib/rate-limit";
import { getTenantFromHeaders } from "@/lib/tenant";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | never> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const rateLimitResult = rateLimit(`login:${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 5,
  });

  if (!rateLimitResult.success) {
    return { error: "Demasiados intentos. Intenta de nuevo en un minuto." };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" };
  }

  // Resolver tenant actual desde los headers
  const tenantCtx = await getTenantFromHeaders();

  // ── Dev/standalone fallback: sin tenant, usar User table directa ──
  if (
    !tenantCtx &&
    (process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_SINGLE_TENANT === "true")
  ) {
    const { prisma: defaultPrisma } = await import("@/lib/prisma");
    const user = await defaultPrisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Credenciales inválidas" };

    const valid = compareSync(password, user.passwordHash);
    if (!valid) return { error: "Credenciales inválidas" };

    await createSession(user.id, "");
    redirect(adminHref("/dashboard"));
  }

  if (!tenantCtx) {
    return { error: "No se pudo resolver el tenant. Accedé desde tu subdominio." };
  }

  // Buscar TenantUser en la DB de plataforma
  const { getPlatformPrisma } = await import("@/lib/prisma");
  const platformDb = await getPlatformPrisma();

  const tenantUser = await platformDb.tenantUser.findUnique({
    where: {
      tenantId_email: {
        tenantId: tenantCtx.tenantId,
        email,
      },
    },
  });

  if (!tenantUser) {
    return { error: "Credenciales inválidas" };
  }

  const valid = compareSync(password, tenantUser.passwordHash);
  if (!valid) {
    return { error: "Credenciales inválidas" };
  }

  await createSession(tenantUser.id, tenantCtx.tenantId);
  redirect(adminHref("/dashboard"));
}

export async function logoutAction(): Promise<never> {
  await deleteSession();
  redirect(adminHref("/login"));
}
