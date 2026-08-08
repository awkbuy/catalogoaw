import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMarketingDashboard, MARKETING_DAYS_OPTIONS } from "@/lib/marketing/dashboard";

export const dynamic = "force-dynamic";

function parseDays(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get("days"));
  return (MARKETING_DAYS_OPTIONS as readonly number[]).includes(raw) ? raw : 30;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = parseDays(req.nextUrl.searchParams);
  const data = await getMarketingDashboard(days);
  return NextResponse.json(data);
}
