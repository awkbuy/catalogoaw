"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { MarketingIntegration } from "@/lib/marketing/dashboard";

export default function IntegrationsStatus({
  integrations,
}: {
  integrations: MarketingIntegration[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {integrations.map((integration) => {
        const ok = integration.configured;
        return (
          <div
            key={integration.id}
            data-testid={`integration-${integration.id}`}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-start gap-4"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                ok ? "bg-[#31D3A9]/10 text-[#31D3A9]" : "bg-[#F3F4F6] text-[#9CA3AF]"
              }`}
            >
              {ok ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-[#1F2937]">{integration.name}</p>
                <span
                  data-testid={`integration-status-${integration.id}`}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    ok ? "bg-[#31D3A9]/15 text-[#0FA47F]" : "bg-[#F3F4F6] text-[#9CA3AF]"
                  }`}
                >
                  {ok ? "Configurado" : "Sin configurar"}
                </span>
              </div>
              <p className="text-[#6B7280] text-sm mt-1 break-all">{integration.detail}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                {integration.enabled ? "Habilitado" : "Deshabilitado"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
