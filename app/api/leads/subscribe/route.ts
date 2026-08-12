import { NextRequest, NextResponse } from "next/server";
import { getTenantDb } from "@/lib/tenant";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { getSeoSettings } from "@/lib/seo";

const MAX_EMAIL_LEN = 254;
const MAX_UTM_LEN = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const email = value.trim().toLowerCase().slice(0, MAX_EMAIL_LEN);
  if (email.length === 0 || !EMAIL_REGEX.test(email)) return undefined;
  return email;
}

function sanitizeUtm(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, MAX_UTM_LEN);
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(req: NextRequest) {
  const prisma = await getTenantDb();
  const ip = getClientIp(req);
  const rateLimitResult = rateLimit(`leads:${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 5,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const email = sanitizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const utm =
    body.utm && typeof body.utm === "object" && !Array.isArray(body.utm)
      ? {
          source: sanitizeUtm(body.utm.source),
          medium: sanitizeUtm(body.utm.medium),
          campaign: sanitizeUtm(body.utm.campaign),
        }
      : null;

  try {
    await prisma.emailLead.upsert({
      where: { email },
      update: {},
      create: {
        email,
        source: "popup",
        utmSource: utm?.source,
        utmMedium: utm?.medium,
        utmCampaign: utm?.campaign,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error guardando la suscripción" },
      { status: 500 }
    );
  }

  try {
    const settings = await getSeoSettings();
    await sendWelcomeEmail(email, {
      businessName: settings.nombreSitio,
      whatsappNumber: settings.orgTelefono,
    });
  } catch {
    // best-effort: el email de bienvenida nunca rompe la suscripción
  }

  return NextResponse.json({ ok: true });
}
