"use client";

import { Share2 } from "lucide-react";
import { trackMarketingEvent } from "@/lib/marketing";
import { sileo } from "sileo";

interface ShareButtonProps {
  game: { id: string; slug: string; nombre: string; categoria: { nombre: string } };
  source: string;
  label?: string;
  className?: string;
}

export default function ShareButton({ game, source, label = "Compartir", className }: ShareButtonProps) {
  const trackShare = () => {
    trackMarketingEvent({
      event: "Share",
      data: {
        content_ids: [game.id],
        content_name: game.nombre,
        content_category: game.categoria.nombre,
        source,
      },
    });
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback al método legacy
      }
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/juegos/${game.slug}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: game.nombre, url });
        trackShare();
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // otros errores: caer al portapapeles
      }
    }
    const copied = await copyToClipboard(url);
    if (copied) {
      sileo.success({ title: "Enlace copiado" });
    } else {
      sileo.error({ title: "No se pudo copiar el enlace" });
    }
    trackShare();
  };

  return (
    <button
      onClick={handleShare}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-text shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
      }
    >
      <Share2 size={16} />
      {label}
    </button>
  );
}
