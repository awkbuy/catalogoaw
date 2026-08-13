"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { X, Mail, Check, Loader2 } from "lucide-react";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import { trackMarketingEvent } from "@/lib/marketing";
import { captureUTMParams } from "@/lib/analytics/utm";
import type { PromoConfig } from "@/lib/promo";
import ImageWithProgress from "@/components/ImageWithProgress";

const COOLDOWN_KEY = "wr_popup_last_shown";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getLastShown(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(COOLDOWN_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function setLastShown(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    // storage bloqueado; el popup se puede volver a mostrar la próxima visita
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EmailPopup({ config }: { config: PromoConfig }) {
  const { isLite } = useAdaptive();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!config.popupEnabled) return;
    const lastShown = getLastShown();
    if (lastShown > 0 && Date.now() - lastShown < WEEK_MS) return;

    const delay = Math.max(0, (config.popupDelaySeconds || 10) * 1000);
    const timeout = setTimeout(() => {
      setOpen(true);
      setLastShown();
    }, delay);
    return () => clearTimeout(timeout);
  }, [config]);

  const close = () => setOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(value) || value.length > 254) {
      setError("Ingresá un email válido.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const utm = captureUTMParams();
      await fetch("/api/leads/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          utm: {
            source: utm.source,
            medium: utm.medium,
            campaign: utm.campaign,
          },
        }),
      });
      trackMarketingEvent({
        event: "EmailSubscribe",
        data: { source: "popup" },
      });
      setDone(true);
    } catch {
      setError("No pudimos guardar tu email. Intentalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

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
            onClick={close}
          />
          <Motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={isLite ? { duration: 0.2 } : { type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          >
            <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
              {config.popupImage ? (
                <div className="relative h-44 w-full shrink-0 sm:h-52">
                  <ImageWithProgress
                    src={config.popupImage}
                    alt={config.popupTitle || "Novedades"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 448px"
                  />
                  <button
                    onClick={close}
                    aria-label="Cerrar"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-[#1F2937]">
                    <Mail size={18} className="text-[#31D3A9]" />
                    {config.popupTitle || "Novedades"}
                  </h2>
                  <button
                    onClick={close}
                    aria-label="Cerrar"
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#E5E7EB]"
                  >
                    <X size={18} className="text-[#6B7280]" />
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5">
                {done ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#31D3A9]/15">
                      <Check size={28} className="text-[#31D3A9]" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#1F2937]">
                      ¡Listo!
                    </h3>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Te avisaremos cuando lleguen novedades y ofertas.
                    </p>
                    <button
                      onClick={close}
                      className="mt-6 w-full rounded-xl bg-[#31D3A9] px-5 py-3 text-sm font-semibold text-[#0B3B30] transition-all hover:bg-[#2bbf96] active:scale-[0.98]"
                    >
                      Seguir viendo productos
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-[#1F2937]">
                      {config.popupTitle || "Novedades"}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                      {config.popupText ||
                        "Dejanos tu email y recibí novedades, ofertas y productos nuevos antes que nadie."}
                    </p>
                    <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
                      <div>
                        <label
                          htmlFor="popup-email"
                          className="mb-1.5 block text-sm font-medium text-[#1F2937]"
                        >
                          Tu email
                        </label>
                        <input
                          id="popup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tucorreo@ejemplo.com"
                          disabled={submitting}
                          className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937] outline-none transition-colors focus:border-[#31D3A9] focus:ring-2 focus:ring-[#31D3A9]/20 disabled:opacity-60"
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-red-500" role="alert">
                          {error}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#31D3A9] px-5 py-3 text-sm font-semibold text-[#0B3B30] transition-all hover:bg-[#2bbf96] active:scale-[0.98] disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Guardando…
                          </>
                        ) : (
                          "Suscribirme"
                        )}
                      </button>
                    </form>
                    <button
                      onClick={close}
                      className="mt-4 w-full text-center text-xs text-[#9CA3AF] transition-colors hover:text-[#6B7280]"
                    >
                      No, gracias
                    </button>
                  </>
                )}
              </div>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
