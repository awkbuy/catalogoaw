"use client";

import { Search, SearchX } from "lucide-react";
import type { MarketingSearchStats } from "@/lib/marketing/dashboard";

function RankedList({
  items,
  emptyText,
}: {
  items: { searchTerm: string; count: number }[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[#6B7280] py-6 text-center">{emptyText}</p>
    );
  }
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.searchTerm}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[#1F2937] font-medium truncate">{item.searchTerm}</span>
            <span className="text-[#6B7280] tabular-nums">{item.count}</span>
          </div>
          <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#31D3A9] rounded-full"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function SearchStats({ stats }: { stats: MarketingSearchStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="search-stats">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#31D3A9]/10 text-[#31D3A9] flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-[#1F2937]">
            Búsquedas más realizadas
          </p>
        </div>
        <RankedList items={stats.topTerms} emptyText="Aún no hay búsquedas registradas." />
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 text-[#F97316] flex items-center justify-center">
            <SearchX className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-[#1F2937]">
            Búsquedas sin resultados
          </p>
        </div>
        <RankedList
          items={stats.noResults}
          emptyText="Sin búsquedas que no hayan dado resultados."
        />
      </div>
    </div>
  );
}
