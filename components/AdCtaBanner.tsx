"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { trackMarketingEvent } from "@/lib/marketing";

function isAdTraffic(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const source = (params.get("utm_source") ?? "").toLowerCase();
  const medium = (params.get("utm_medium") ?? "").toLowerCase();
  return (
    ["facebook", "instagram", "meta", "google", "ads", "tiktok", "youtube"].includes(source) ||
    medium === "cpc" ||
    medium === "paid" ||
    Boolean(params.get("fbclid")) ||
    Boolean(params.get("gclid"))
  );
}

export default function AdCtaBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(isAdTraffic()));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!show) return null;

  return (
    <div className="sticky top-16 z-40 bg-gradient-to-r from-[#0B3B30] to-[#31D3A9] px-4 py-2.5 text-center shadow-md">
      <button
        onClick={() => {
          trackMarketingEvent({
            event: "ViewContent",
            data: {
              content_name: "Banner ads CTA",
              source: "ad_banner_click",
            },
          });
          document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="inline-flex items-center gap-2 text-sm font-bold text-white"
      >
        <Zap size={16} />
        Comprá tus juegos de mesa hoy
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">Ver catálogo</span>
      </button>
    </div>
  );
}
