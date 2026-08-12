"use client";

import { useCallback, useState } from "react";
import {
  BarChart3,
  FolderOpen,
  Globe,
  Loader2,
  MessageCircle,
  Package,
  Search,
  Plug,
  Mail,
} from "lucide-react";
import type { MarketingDashboardData } from "@/lib/marketing/dashboard";
import DateRangeSelector from "./DateRangeSelector";
import MarketingKPICards from "./MarketingKPICards";
import TrendChart from "./TrendChart";
import ProductsTable from "./ProductsTable";
import CategoriesChart from "./CategoriesChart";
import WhatsAppStats from "./WhatsAppStats";
import SearchStats from "./SearchStats";
import TrafficStats from "./TrafficStats";
import IntegrationsStatus from "./IntegrationsStatus";
import LeadsTable from "./LeadsTable";

type TabId =
  | "general"
  | "productos"
  | "categorias"
  | "whatsapp"
  | "busquedas"
  | "trafico"
  | "integraciones"
  | "leads";

const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "productos", label: "Productos" },
  { id: "categorias", label: "Categorías" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "busquedas", label: "Búsquedas" },
  { id: "trafico", label: "Tráfico" },
  { id: "integraciones", label: "Integraciones" },
  { id: "leads", label: "Leads" },
];

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  general: <BarChart3 className="w-4 h-4" />,
  productos: <Package className="w-4 h-4" />,
  categorias: <FolderOpen className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  busquedas: <Search className="w-4 h-4" />,
  trafico: <Globe className="w-4 h-4" />,
  integraciones: <Plug className="w-4 h-4" />,
  leads: <Mail className="w-4 h-4" />,
};

export default function MarketingDashboard({
  initialData,
}: {
  initialData: MarketingDashboardData;
}) {
  const [days, setDays] = useState(initialData.days);
  const [data, setData] = useState<MarketingDashboardData>(initialData);
  const [tab, setTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (range: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketing/dashboard?days=${range}`);
      if (!res.ok) throw new Error("Error cargando el dashboard");
      const next = (await res.json()) as MarketingDashboardData;
      setData(next);
    } catch {
      // se conserva el último snapshot ante errores de red
    } finally {
      setLoading(false);
    }
  }, []);

  const changeRange = useCallback(
    (next: number) => {
      setDays(next);
      fetchData(next);
    },
    [fetchData]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Marketing</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Métricas de tráfico, ventas e integraciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-[#6B7280] animate-spin" />}
          <DateRangeSelector days={days} onChange={changeRange} />
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-[#31D3A9] text-white shadow-sm"
                : "text-[#6B7280] hover:bg-[#E5E7EB]/50 hover:text-[#1F2937]"
            }`}
          >
            {TAB_ICONS[t.id]}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-6">
          <MarketingKPICards totals={data.totals} />
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <p className="text-sm font-medium text-[#1F2937] mb-4">
              Tendencia diaria (últimos {data.days} días)
            </p>
            <TrendChart trend={data.trend} />
          </div>
        </div>
      )}

      {tab === "productos" && (
        <div className="space-y-6">
          <ProductsTable products={data.products} />
        </div>
      )}

      {tab === "categorias" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <p className="text-sm font-medium text-[#1F2937] mb-4">
              Vistas, carritos y WhatsApp por categoría
            </p>
            <CategoriesChart categories={data.categories} />
          </div>
        </div>
      )}

      {tab === "whatsapp" && <WhatsAppStats stats={data.whatsapp} />}

      {tab === "busquedas" && <SearchStats stats={data.search} />}

      {tab === "trafico" && <TrafficStats stats={data.traffic} />}

      {tab === "integraciones" && (
        <div className="space-y-6">
          <IntegrationsStatus integrations={data.integrations} />
        </div>
      )}

      {tab === "leads" && (
        <div className="space-y-6">
          <LeadsTable />
        </div>
      )}
    </div>
  );
}
