import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, sanitizeError } from "@/lib/errors";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.shippingZone.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await parseJsonBody(req);
  if (!data) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const name = String(data.name || "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Ingresá un nombre para la zona de envío" },
      { status: 400 }
    );
  }

  try {
    const item = await prisma.shippingZone.create({
      data: {
        name,
        cost: Math.max(0, Number(data.cost) || 0),
        freeFrom: Math.max(0, Number(data.freeFrom) || 0),
        active: data.active !== false,
        order: Math.max(0, Number(data.order) || 0),
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
