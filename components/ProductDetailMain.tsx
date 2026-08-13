"use client";

import { useState, type ReactNode } from "react";
import ImageWithProgress from "@/components/ImageWithProgress";
import { getYouTubeEmbedUrl } from "@/lib/video";
import ShareButton from "@/components/ShareButton";

export interface ProductDetailProduct {
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
  disponibleVenta: boolean;
}

interface ProductDetailMainProps {
  product: ProductDetailProduct;
  source: string;
  showShareButton?: boolean;
  children?: ReactNode;
}

export default function ProductDetailMain({
  product,
  source,
  showShareButton = false,
  children,
}: ProductDetailMainProps) {
  const [observacion, setObservacion] = useState("");
  const embedUrl = product.integrarVideo ? getYouTubeEmbedUrl(product.videoUrl) : null;

  return (
    <div>
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ backgroundColor: `${product.categoria.color}14` }}
      >
        <span
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: product.categoria.color }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: product.categoria.color }}
          />
          {product.categoria.nombre}
        </span>
        <div className="flex items-center gap-2">
          {Array.from(
            new Map(
              (product.categorias ?? [])
                .filter((c) => c.nombre !== product.categoria.nombre)
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
            style={{ backgroundColor: product.categoria.color }}
          />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {product.imagen && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#E5E7EB]">
            <ImageWithProgress
              src={product.imagen}
              alt={product.nombre}
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
            <h1 className="text-2xl font-bold text-[#1F2937]">{product.nombre}</h1>
            {showShareButton && <ShareButton product={product} source={source} />}
          </div>
          {product.descripcion && (
            <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{product.descripcion}</p>
          )}
        </div>

        {embedUrl && (
          <div className="aspect-video overflow-hidden rounded-xl border border-[#E5E7EB] bg-black">
            <iframe
              src={embedUrl}
              title={`Video de ${product.nombre}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full"
            />
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
      </div>
    </div>
  );
}
