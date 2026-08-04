import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_SETTINGS_KEYS = [
  "businessName",
  "businessSlogan",
  "whatsappNumber",
  "email",
  "address",
  "city",
  "province",
  "postalCode",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "heroTitle",
  "heroSubtitle",
  "heroButtonText",
  "heroButtonLink",
  "categoriesHeroTitle",
  "categoriesHeroSubtitle",
  "featuredProductsTitle",
  "featuredProductsSubtitle",
  "featuredCategoryId",
  "catalogTitle",
  "catalogSubtitle",
  "catalogHeroImage",
  "ga4MeasurementId",
  "paymentLink",
  "bankTransferAlias",
  "bankTransferCbu",
];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.setting.findMany();
  const data: Record<string, string> = {};
  for (const s of settings) {
    data[s.key] = s.value;
  }
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data: Record<string, string> = await req.json();

  const invalidKeys = Object.keys(data).filter(
    (key) => !ALLOWED_SETTINGS_KEYS.includes(key)
  );
  if (invalidKeys.length > 0) {
    return NextResponse.json(
      { error: "Invalid settings keys" },
      { status: 400 }
    );
  }

  try {
    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error saving settings" },
      { status: 500 }
    );
  }
}
