"use client";

import { Monitor, Smartphone, Tablet, Globe, TrendingUp, Megaphone } from "lucide-react";
import type { MarketingTrafficItem, MarketingTrafficStats } from "@/lib/marketing/dashboard";

const DEVICE_ICONS: Record<string, React.ElementType> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function deviceLabel(device: string): string {
  const map: Record<string, string> = {
    desktop: "Desktop",
    mobile: "Mobile",
    tablet: "Tablet",
  };
  return map[device] || device;
}

function DistributionList({
  title,
  icon: Icon,
  items,
  accentClass,
}: {
  title: string;
  icon: React.ElementType;
  items: MarketingTrafficItem[];
  accentClass: string;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-lg ${accentClass} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-[#1F2937]">{title}</p>
        </div>
        <p className="text-sm text-[#6B7280] text-center py-4">Sin datos todavía.</p>
      </div>
    );
  }
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg ${accentClass} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm font-medium text-[#1F2937]">{title}</p>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[#1F2937] font-medium truncate">{item.label}</span>
              <span className="text-[#6B7280] tabular-nums">{item.count}</span>
            </div>
            <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(item.count / max) * 100}%`, background: "#31D3A9" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TrafficStats({ stats }: { stats: MarketingTrafficStats }) {
  const devices = stats.devices.map((d) => ({ ...d, label: deviceLabel(d.label) }));

  return (
    <div className="space-y-6" data-testid="traffic-stats">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="w-10 h-10 rounded-xl bg-[#31D3A9]/10 text-[#31D3A9] flex items-center justify-center mb-3">
            <Globe className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-[#1F2937]">{stats.totalPageViews}</p>
          <p className="text-[#6B7280] text-sm mt-0.5">Vistas de página</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionList
          title="Fuentes de tráfico"
          icon={Globe}
          items={stats.sources}
          accentClass="bg-[#31D3A9]/10 text-[#31D3A9]"
        />
        <DistributionList
          title="Campañas UTM"
          icon={Megaphone}
          items={stats.campaigns}
          accentClass="bg-[#FF7BAC]/10 text-[#FF7BAC]"
        />
        <DistributionList
          title="Medios UTM"
          icon={TrendingUp}
          items={stats.mediums}
          accentClass="bg-[#A78BFA]/10 text-[#A78BFA]"
        />
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#FBBF24]/10 text-[#B45309] flex items-center justify-center">
              <Monitor className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-[#1F2937]">Dispositivos</p>
          </div>
          {devices.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-4">Sin datos todavía.</p>
          ) : (
            <ul className="space-y-3">
              {devices.map((d) => {
                const Icon = DEVICE_ICONS[d.label.toLowerCase()] || Monitor;
                return (
                  <li key={d.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[#1F2937] font-medium">
                      <Icon className="w-4 h-4 text-[#9CA3AF]" />
                      {d.label}
                    </span>
                    <span className="text-[#6B7280] tabular-nums">{d.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
