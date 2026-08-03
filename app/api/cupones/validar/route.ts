import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const codigo = String(body.codigo || "").trim().toUpperCase();
  const subtotal = Number(body.subtotal) || 0;

  if (!codigo) {
    return NextResponse.json({ error: "Ingresá un código de cupón" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({ where: { codigo } });

  if (!coupon) {
    return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
  }
  if (!coupon.activo) {
    return NextResponse.json({ error: "Este cupón no está activo" }, { status: 400 });
  }
  if (coupon.vencimiento && coupon.vencimiento < new Date()) {
    return NextResponse.json({ error: "Este cupón está vencido" }, { status: 400 });
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
