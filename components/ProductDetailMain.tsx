"use client";

import { useState, type ReactNode } from "react";
import { Users, Clock, Baby, MessageCircle } from "lucide-react";
import ImageWithProgress from "@/components/ImageWithProgress";
import { getYouTubeEmbedUrl } from "@/lib/video";
import ShareButton from "@/components/ShareButton";

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
  envioGratis: boolean;
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

interface ProductDetailMainProps {
  game: ProductDetailGame;
  source: string;
  showShareButton?: boolean;
  children?: ReactNode;
}

export default function ProductDetailMain({
  game,
  source,
  showShareButton = false,
  children,
}: ProductDetailMainProps) {
  const [observacion, setObservacion] = useState("");
  const embedUrl = game.integrarVideo ? getYouTubeEmbedUrl(game.videoUrl) : null;

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

        {children}

        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-bold text-[#1F2937]">{game.nombre}</h3>
            {showShareButton && <ShareButton game={game} source={source} />}
          </div>
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
      </div>
    </div>
  );
}
