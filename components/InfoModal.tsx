"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { X, Clock, MapPin, CalendarCheck } from "lucide-react";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  DIAS_NOMBRES,
  obtenerEstadoHorario,
  type DiaHorario,
  type EstadoInfo,
} from "@/lib/horarios";

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  horarios: DiaHorario[];
  whatsappNumber: string;
  businessName: string;
}

export default function InfoModal({
  open,
  onClose,
  horarios,
  whatsappNumber,
  businessName,
}: InfoModalProps) {
  const { isLite } = useAdaptive();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, [open]);

  const estado: EstadoInfo = obtenerEstadoHorario(horarios, now);
  const diaHoy = now.getDay();
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola. Quisiera hacer un pedido en ${businessName}.`
  )}`;

  const statusConfig = {
    abierto: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-600",
      titulo: "Estamos abiertos",
      mensaje: `Podés visitarnos o hacer tu pedido. Cerramos hoy a las ${estado.cierraHoy} hs.`,
    },
    por_cerrar: {
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-600",
      titulo: "Estamos por cerrar",
      mensaje: `Quedan menos de ${estado.faltanMin} minutos antes del cierre. Si querés, podés hacer tu pedido por WhatsApp y lo preparamos.`,
    },
    cerrado: {
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-600",
      titulo: "Estamos cerrados",
      mensaje:
        "Ahora mismo estamos fuera de nuestro horario de atención. Podés hacer tu pedido por WhatsApp y pronto lo atenderemos.",
    },
  }[estado.estado];

  return (
    <AnimatePresence>
      {open && (
        <>
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-50 ${isLite ? "bg-black/50" : "bg-black/40 backdrop-blur-sm"}`}
            onClick={onClose}
          />
          <Motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={isLite ? { duration: 0.2 } : { type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          >
            <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#1F2937]">
                  <Clock size={18} className="text-[#31D3A9]" />
                  Información
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#E5E7EB]"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div
                  className={`mb-5 flex items-start gap-3 rounded-2xl p-4 ${statusConfig.badge}`}
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${statusConfig.dot} animate-pulse`}
                  />
                  <div>
                    <p className="text-sm font-bold">{statusConfig.titulo}</p>
                    <p className="mt-0.5 text-sm opacity-90">
                      {statusConfig.mensaje}
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex items-center gap-2 text-sm text-[#6B7280]">
                  <CalendarCheck size={16} className="text-[#31D3A9]" />
                  <span>Horarios de atención</span>
                </div>

                <div className="space-y-1.5">
                  {horarios.map((h) => {
                    const esHoy = h.dia === diaHoy;
                    return (
                      <div
                        key={h.dia}
                        className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                          esHoy
                            ? "bg-[#31D3A9]/10 ring-1 ring-[#31D3A9]/30"
                            : "bg-[#FAFAFA]"
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            esHoy
                              ? "font-bold text-[#31D3A9]"
                              : "font-medium text-[#1F2937]"
                          }`}
                        >
                          {DIAS_NOMBRES[h.dia]}
                          {esHoy && (
                            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide">
                              Hoy
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-sm ${
                            h.abierto
                              ? "font-semibold text-[#1F2937]"
                              : "font-medium text-[#9CA3AF]"
                          }`}
                        >
                          {h.abierto
                            ? `${h.apertura} - ${h.cierre} hs`
                            : "Cerrado"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-2xl border border-[#E5E7EB] p-4">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#31D3A9]" />
                  <p className="text-sm text-[#6B7280]">
                    {businessName} · Patio Lorenza, Mendoza
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] p-5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:bg-[#1fb959] hover:shadow-xl active:scale-[0.98]"
                >
                  <WhatsAppIcon size={16} />
                  Hacer pedido por WhatsApp
                </a>
              </div>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
