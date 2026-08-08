"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { MessageCircle } from "lucide-react";
import type {
  MarketingWhatsAppStats,
  MarketingWhatsAppTopProduct,
} from "@/lib/marketing/dashboard";

function TopProducts({ products }: { products: MarketingWhatsAppTopProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-[#6B7280] py-6 text-center">
        Sin clics en WhatsApp todavía.
      </p>
    );
  }
  const max = Math.max(...products.map((p) => p.totalWhatsapp));
  return (
    <ul className="space-y-3">
      {products
        .filter((p) => p.totalWhatsapp > 0)
        .slice(0, 5)
        .map((p) => (
          <li key={p.gameId}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[#1F2937] font-medium truncate">{p.gameName}</span>
              <span className="text-[#6B7280] tabular-nums">{p.totalWhatsapp}</span>
            </div>
            <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#31D3A9] rounded-full"
                style={{ width: `${(p.totalWhatsapp / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
    </ul>
  );
}

export default function WhatsAppStats({ stats }: { stats: MarketingWhatsAppStats }) {
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const point = stats.hourly.find((h) => h.hour === hour);
    return { hour: `${String(hour).padStart(2, "0")}:00`, count: point?.count ?? 0 };
  });

  return (
    <div className="space-y-6" data-testid="whatsapp-stats">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="w-10 h-10 rounded-xl bg-[#31D3A9]/10 text-[#31D3A9] flex items-center justify-center mb-3">
            <MessageCircle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-[#1F2937]">{stats.totalClicks}</p>
          <p className="text-[#6B7280] text-sm mt-0.5">Clics en WhatsApp</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <p className="text-sm font-medium text-[#1F2937] mb-4">
          Clics por hora del día
        </p>
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                interval={2}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" name="Clics" fill="#31D3A9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <p className="text-sm font-medium text-[#1F2937] mb-4">
            Productos más consultados
          </p>
          <TopProducts products={stats.topProducts} />
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="p-6 pb-3">
            <p className="text-sm font-medium text-[#1F2937]">
              Conversión por categoría
            </p>
          </div>
          {stats.byCategory.length === 0 ? (
            <p className="text-sm text-[#6B7280] px-6 pb-6 text-center">
              Sin datos de categorías todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6B7280] text-xs uppercase tracking-wide border-b border-[#E5E7EB]">
                    <th className="px-6 py-3 font-medium">Categoría</th>
                    <th className="px-6 py-3 font-medium text-right">Vistas</th>
                    <th className="px-6 py-3 font-medium text-right">WhatsApp</th>
                    <th className="px-6 py-3 font-medium text-right">Conversión</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCategory.map((c) => (
                    <tr
                      key={c.categoryName}
                      className="border-b border-[#E5E7EB]/60 last:border-0"
                    >
                      <td className="px-6 py-3 text-[#1F2937]">{c.categoryName}</td>
                      <td className="px-6 py-3 text-right text-[#6B7280]">{c.totalViews}</td>
                      <td className="px-6 py-3 text-right text-[#6B7280]">
                        {c.totalWhatsapp}
                      </td>
                      <td className="px-6 py-3 text-right text-[#0FA47F] font-medium">
                        {c.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
