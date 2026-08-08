"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MarketingCategoryRow } from "@/lib/marketing/dashboard";

export default function CategoriesChart({
  categories,
}: {
  categories: MarketingCategoryRow[];
}) {
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center">
        <p className="text-[#6B7280] text-sm">
          Aún no hay métricas por categoría. Navegá el catálogo para comenzar a
          medir vistas, carritos y clics en WhatsApp.
        </p>
      </div>
    );
  }

  const data = categories.map((c) => ({
    name: c.categoryName,
    Vistas: c.totalViews,
    Carrito: c.totalCartAdds,
    WhatsApp: c.totalWhatsapp,
  }));

  return (
    <div data-testid="categories-chart" className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 12, fill: "#4B5563" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Vistas" fill="#31D3A9" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="Carrito" fill="#FF7BAC" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="WhatsApp" fill="#A78BFA" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
