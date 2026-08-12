import { NextRequest, NextResponse } from "next/server";
import { getTenantDb } from "@/lib/tenant";
import { formatPrice } from "@/lib/format";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const prisma = await getTenantDb();
  const ip = getClientIp(req);
  const rateLimitResult = rateLimit(`coupon:${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 10,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const codigo = String(body.codigo || "").trim().toUpperCase();
  const subtotal = Number(body.subtotal) || 0;

  if (!codigo) {
    return NextResponse.json({ error: "Ingresá un código de cupón" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({ where: { codigo } });

  if (!coupon) {
    return NextResponse.json({ error: "Cupón no válido" }, { status: 400 });
  }
  if (!coupon.activo) {
    return NextResponse.json({ error: "Cupón no válido" }, { status: 400 });
  }
  if (coupon.vencimiento && coupon.vencimiento < new Date()) {
    return NextResponse.json({ error: "Cupón no válido" }, { status: 400 });
  }
  if (coupon.minimo > 0 && subtotal < coupon.minimo) {
    return NextResponse.json(
      { error: `El mínimo de compra para este cupón es ${formatPrice(coupon.minimo)}` },
      { status: 400 }
    );
  }

  return NextResponse.json({
    codigo: coupon.codigo,
    tipo: coupon.tipo,
    valor: coupon.valor,
    minimo: coupon.minimo,
    maximo: coupon.maximo,
  });
}
