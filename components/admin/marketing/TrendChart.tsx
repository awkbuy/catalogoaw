"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MarketingTrendPoint } from "@/lib/marketing/dashboard";

export default function TrendChart({ trend }: { trend: MarketingTrendPoint[] }) {
  return (
    <div data-testid="trend-chart" className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPageViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#31D3A9" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#31D3A9" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradProductViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7BAC" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FF7BAC" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => value.slice(5)}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            interval="preserveStartEnd"
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
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="pageViews"
            name="Vistas de página"
            stroke="#31D3A9"
            strokeWidth={2}
            fill="url(#gradPageViews)"
          />
          <Area
            type="monotone"
            dataKey="productViews"
            name="Vistas de producto"
            stroke="#FF7BAC"
            strokeWidth={2}
            fill="url(#gradProductViews)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
