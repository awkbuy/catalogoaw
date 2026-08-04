"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { sileo } from "sileo";
import {
  DIAS_NOMBRES,
  CLAVE_SETTING,
  parsearHorarios,
  serializarHorarios,
  type DiaHorario,
} from "@/lib/horarios";

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<DiaHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setHorarios(parsearHorarios(data[CLAVE_SETTING]));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateDia = (dia: number, cambios: Partial<DiaHorario>) => {
    setHorarios((prev) =>
      prev.map((h) => (h.dia === dia ? { ...h, ...cambios } : h))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [CLAVE_SETTING]: serializarHorarios(horarios) }),
      });
      if (res.ok) {
        sileo.success({ title: "Horarios guardados correctamente" });
      } else {
        sileo.error({ title: "Error al guardar los horarios" });
      }
    } catch {
      sileo.error({ title: "Error al guardar los horarios" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#31D3A9]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Horarios de atención</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Configurá la apertura y cierre de cada día de la semana
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] disabled:opacity-60 transition-all"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Guardando..." : "Guardar horarios"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-[#E5E7EB]">
          <span className="col-span-4 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
            Día
          </span>
          <span className="col-span-2 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
            Abierto
          </span>
          <span className="col-span-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
            Apertura
          </span>
          <span className="col-span-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
            Cierre
          </span>
        </div>

        <div className="divide-y divide-[#E5E7EB]/50">
          {horarios.map((h) => (
            <div
              key={h.dia}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="col-span-4">
                <span className="text-sm font-semibold text-[#1F2937]">
                  {DIAS_NOMBRES[h.dia]}
                </span>
              </div>

              <div className="col-span-2">
                <button
                  role="switch"
                  aria-checked={h.abierto}
                  onClick={() => updateDia(h.dia, { abierto: !h.abierto })}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                    h.abierto ? "bg-[#31D3A9]" : "bg-[#E5E7EB]"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      h.abierto ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="col-span-3">
                <input
                  type="time"
                  value={h.apertura}
                  disabled={!h.abierto}
                  onChange={(e) => updateDia(h.dia, { apertura: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-sm text-[#1F2937] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                />
              </div>

              <div className="col-span-3">
                <input
                  type="time"
                  value={h.cierre}
                  disabled={!h.abierto}
                  onChange={(e) => updateDia(h.dia, { cierre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-sm text-[#1F2937] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-[#9CA3AF]">
        Si un día está cerrado, el sitio mostrará &quot;Cerrado&quot; y avisará a los
        clientes que pueden hacer su pedido por WhatsApp.
      </p>
    </div>
  );
}
