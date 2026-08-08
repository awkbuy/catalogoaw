import { getMarketingDashboard } from "@/lib/marketing/dashboard";
import MarketingDashboard from "@/components/admin/marketing/MarketingDashboard";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const initialData = await getMarketingDashboard(30);
  return <MarketingDashboard initialData={initialData} />;
}
