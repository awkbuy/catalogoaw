"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Users, Clock, Baby, MessageCircle, Share2 } from "lucide-react";
import ImageWithProgress from "@/components/ImageWithProgress";
import { useCart } from "@/lib/cart-context";
import { trackMarketingEvent } from "@/lib/marketing";
import { parsePrice, formatPrice } from "@/lib/format";
import { getYouTubeEmbedUrl } from "@/lib/video";
import {
  LEYENDA_SIN_IMPUESTOS,
  calcularPrecioSinImpuestos,
  formatPrecioConDecimales,
  type TaxConfig,
} from "@/lib/tax";
import { sileo } from "sileo";

export interface ProductDetailGame {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  integrarVideo: boolean;
  videoUrl: string;
  precioFinalVenta: string;
  descuento: number;
  categoria: { nombre: string; icono: string; color: string };
  categorias?: { nombre: string; icono: string; color: string }[];
  jugadoresMin: number;
  jugadoresMax: number;
  duracion: string;
  edad: string;
  dificultad: string;
  disponibleVenta: boolean;
  disponibleMesa: boolean;
}

interface ProductDetailContentProps {
  game: ProductDetailGame;
  taxConfig: TaxConfig;
  source: string;
  onAdded?: () => void;
}

export default function ProductDetailContent({
  game,
  taxConfig,
  source,
  onAdded,
}: ProductDetailContentProps) {
  const { addItem } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [observacion, setObservacion] = useState("");

  const precioNum = parsePrice(game.precioFinalVenta);
  const precioFinal = game.descuento > 0 ? precioNum * (1 - game.descuento / 100) : precioNum;
  const embedUrl = game.integrarVideo ? getYouTubeEmbedUrl(game.videoUrl) : null;
  const mostrarSinImpuestos =
    taxConfig.activoCalculoAutomatico &&
    taxConfig.mostrarPrecioSinImpuestos &&
    precioNum > 0;
  const precioSinImpuestos = mostrarSinImpuestos
    ? formatPrecioConDecimales(calcularPrecioSinImpuestos(precioFinal, taxConfig))
    : "";

  const handleAdd = () => {
    for (let i = 0; i < cantidad; i++) {
      addItem({
        gameId: game.id,
        nombre: game.nombre,
        precio: game.precioFinalVenta,
        precioNum,
        imagen: game.imagen,
      });
    }
    trackMarketingEvent({
      event: "AddToCart",
      data: {
        content_ids: [game.id],
        content_name: game.nombre,
        content_category: game.categoria.nombre,
        value: precioFinal,
        currency: "ARS",
        quantity: cantidad,
        source,
      },
    });
    setCantidad(1);
    setObservacion("");
    onAdded?.();
  };

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
    <div>
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ backgroundColor: `${game.categoria.color}14` }}
      >
        <span
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: game.categoria.color }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: game.categoria.color }}
          />
          {game.categoria.nombre}
        </span>
        <div className="flex items-center gap-2">
          {Array.from(
            new Map(
              (game.categorias ?? [])
                .filter((c) => c.nombre !== game.categoria.nombre)
                .map((c) => [c.nombre, c])
            ).values()
          ).map((c) => (
            <span
              key={c.nombre}
              className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#6B7280]"
            >
              {c.nombre}
            </span>
          ))}
          <span
            className="h-1.5 w-24 rounded-full"
            style={{ backgroundColor: game.categoria.color }}
          />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {game.imagen && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#E5E7EB]">
            <ImageWithProgress
              src={game.imagen}
              alt={game.nombre}
              fill
              sizes="(max-width: 512px) 100vw, 512px"
              className="absolute inset-0"
              imgClassName="object-cover"
            />
          </div>
        )}

        <div>
          <h3 className="text-2xl font-bold text-[#1F2937]">{game.nombre}</h3>
          {game.descripcion && (
            <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{game.descripcion}</p>
          )}
        </div>

        {embedUrl && (
          <div className="aspect-video overflow-hidden rounded-xl border border-[#E5E7EB] bg-black">
            <iframe
              src={embedUrl}
              title={`Video de ${game.nombre}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full"
            />
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "jugadores", icon: Users, label: `${game.jugadoresMin}-${game.jugadoresMax}` },
            { id: "duracion", icon: Clock, label: game.duracion },
            { id: "edad", icon: Baby, label: game.edad },
            { id: "dificultad", icon: MessageCircle, label: game.dificultad },
          ]
            .filter(({ label }) => label.trim() !== "")
            .map(({ id, icon: Icon, label }) => (
              <div key={id} className="flex flex-col items-center gap-1 rounded-xl bg-[#FAFAFA] p-2.5">
                <Icon size={14} className="text-[#31D3A9]" />
                <span className="text-xs font-medium text-[#6B7280] text-center leading-tight">{label}</span>
              </div>
            ))}
        </div>

        {game.disponibleVenta && game.precioFinalVenta && (
          <div>
            <span className="text-sm text-[#6B7280]">Precio de venta</span>
            {game.descuento > 0 ? (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-red-500">
                  {formatPrice(precioNum * (1 - game.descuento / 100))}
                </p>
                <span className="text-base text-[#9CA3AF] line-through">{formatPrice(precioNum)}</span>
                <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">-{game.descuento}%</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-[#1F2937]">{formatPrice(precioNum)}</p>
            )}
            {precioSinImpuestos && (
              <div className="mt-1.5">
                <p className="text-xs font-medium text-[#6B7280]">
                  {LEYENDA_SIN_IMPUESTOS}
                </p>
                <p className="text-xs text-[#6B7280]">{precioSinImpuestos}</p>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Observaciones</label>
          <textarea
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej: incluir todos los accesorios, consultar por el estado de la caja..."
            rows={3}
            className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-sm text-[#1F2937] resize-none focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[#1F2937]">Cantidad</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              aria-label="Disminuir cantidad"
              className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#FAFAFA] transition-colors"
            >
              <Minus size={14} className="text-[#6B7280]" />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-[#1F2937]">{cantidad}</span>
            <button
              onClick={() => setCantidad(cantidad + 1)}
              aria-label="Aumentar cantidad"
              className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#FAFAFA] transition-colors"
            >
              <Plus size={14} className="text-[#6B7280]" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB] p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#1F2937] shadow-sm transition-all hover:border-[#31D3A9]/30 hover:shadow-md"
          >
            <Share2 size={16} />
            Compartir
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#31D3A9] px-5 py-3 text-sm font-semibold text-[#0B3B30] shadow-lg shadow-[#31D3A9]/20 hover:bg-[#2bc49b] hover:shadow-xl hover:shadow-[#31D3A9]/30 active:scale-[0.98] transition-all"
          >
            <ShoppingCart size={16} />
            Agregar al carrito {cantidad > 1 && `(${cantidad} unidades)`}
          </button>
        </div>
      </div>
    </div>
  );
}
