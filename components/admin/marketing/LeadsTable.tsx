"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Mail } from "lucide-react";

interface Lead {
  id: string;
  email: string;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/leads?limit=200")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.leads)) setLeads(data.leads);
        else setError("No se pudieron cargar los leads.");
      })
      .catch(() => setError("No se pudieron cargar los leads."));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/leads?format=csv&limit=500");
      if (!res.ok) throw new Error("Error exportando");
      const text = await res.text();
      const blob = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo exportar el CSV.");
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#31D3A9]" />
          <p className="text-sm font-medium text-[#1F2937]">
            Emails capturados
            {leads ? (
              <span className="ml-1.5 text-[#9CA3AF] font-normal">
                (últimos {leads.length})
              </span>
            ) : null}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !leads || leads.length === 0}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#1F2937] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          Exportar CSV
        </button>
      </div>

      {leads === null ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-[#31D3A9]" />
        </div>
      ) : leads.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#9CA3AF]">
          Todavía no hay emails capturados. El popup de captura aparece en la
          página principal.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-left text-xs uppercase tracking-wide text-[#9CA3AF]">
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Origen</th>
                <th className="py-2 font-medium">UTM</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-[#F3F4F6] last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-[#1F2937]">
                    {l.email}
                  </td>
                  <td className="py-2.5 pr-4 text-[#6B7280]">
                    {new Date(l.createdAt).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 pr-4 text-[#6B7280]">{l.source}</td>
                  <td className="py-2.5 text-[#6B7280]">
                    {[l.utmSource, l.utmMedium, l.utmCampaign]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
