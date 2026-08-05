"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingCart, Users, Clock, Baby, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import { parsePrice, formatPrice } from "@/lib/format";
import { getYouTubeEmbedUrl } from "@/lib/video";
import {
  LEYENDA_SIN_IMPUESTOS,
  calcularPrecioSinImpuestos,
  formatPrecioConDecimales,
  type TaxConfig,
} from "@/lib/tax";

interface GameDetail {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  integrarVideo: boolean;
  videoUrl: string;
  precioFinalVenta: string;
  descuento: number;
  categoria: { nombre: string; icono: string; color: string };
  jugadoresMin: number;
  jugadoresMax: number;
  duracion: string;
  edad: string;
  dificultad: string;
  disponibleVenta: boolean;
  disponibleMesa: boolean;
}

interface ProductDetailModalProps {
  game: GameDetail | null;
  open: boolean;
  onClose: () => void;
  taxConfig: TaxConfig;
}

export default function ProductDetailModal({ game, open, onClose, taxConfig }: ProductDetailModalProps) {
  const { isLite } = useAdaptive();
  const { addItem } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [observacion, setObservacion] = useState("");

  if (!game) return null;

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
    setCantidad(1);
    setObservacion("");
    onClose();
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
            onClick={onClose}
          />
          <Motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={isLite ? { duration: 0.2 } : { type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-lg font-bold text-[#1F2937]">Detalle del producto</h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
              >
                <X size={18} className="text-[#6B7280]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
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
                <span
                  className="h-1.5 w-24 rounded-full"
                  style={{ backgroundColor: game.categoria.color }}
                />
              </div>

              <div className="p-5 space-y-5">
                {game.imagen && (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#E5E7EB]">
                    <Image
                      src={game.imagen}
                      alt={game.nombre}
                      fill
                      sizes="(max-width: 512px) 100vw, 512px"
                      className="object-cover"
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
                    { icon: Users, label: `${game.jugadoresMin}-${game.jugadoresMax}` },
                    { icon: Clock, label: game.duracion },
                    { icon: Baby, label: game.edad },
                    { icon: MessageCircle, label: game.dificultad },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-[#FAFAFA] p-2.5">
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
            </div>

            <div className="border-t border-[#E5E7EB] p-5">
              <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#31D3A9] px-5 py-3 text-sm font-semibold text-[#0B3B30] shadow-lg shadow-[#31D3A9]/20 hover:bg-[#2bc49b] hover:shadow-xl hover:shadow-[#31D3A9]/30 active:scale-[0.98] transition-all"
              >
                <ShoppingCart size={16} />
                Agregar al carrito {cantidad > 1 && `(${cantidad} unidades)`}
              </button>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
