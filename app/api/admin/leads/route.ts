import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";

const MAX_LIMIT = 500;

function sanitizeInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max
    ? parsed
    : fallback;
}

export async function GET(req: NextRequest) {
  const prisma = await getTenantDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const limit = sanitizeInt(searchParams.get("limit"), 200, MAX_LIMIT);

  const leads = await prisma.emailLead.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (format === "csv") {
    const escapeCsv = (value: string): string =>
      `"${value.replace(/"/g, '""')}"`;
    const header = "email,source,utm_source,utm_medium,utm_campaign,created_at";
    const rows = leads.map((l) =>
      [
        escapeCsv(l.email),
        escapeCsv(l.source),
        escapeCsv(l.utmSource || ""),
        escapeCsv(l.utmMedium || ""),
        escapeCsv(l.utmCampaign || ""),
        escapeCsv(l.createdAt.toISOString()),
      ].join(",")
    );
    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    leads: leads.map((l) => ({
      id: l.id,
      email: l.email,
      source: l.source,
      utmSource: l.utmSource,
      utmMedium: l.utmMedium,
      utmCampaign: l.utmCampaign,
      createdAt: l.createdAt,
    })),
    total: leads.length,
  });
}
