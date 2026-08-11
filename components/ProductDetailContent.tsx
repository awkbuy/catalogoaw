"use client";

import { Minus, Plus } from "lucide-react";
import ProductDetailMain from "./ProductDetailMain";
import { parsePrice, formatPrice } from "@/lib/format";
import {
  LEYENDA_SIN_IMPUESTOS,
  calcularPrecioSinImpuestos,
  formatPrecioConDecimales,
  type TaxConfig,
} from "@/lib/tax";

export type { ProductDetailGame } from "./ProductDetailMain";

interface ProductDetailContentProps {
  game: import("./ProductDetailMain").ProductDetailGame;
  taxConfig: TaxConfig;
  source: string;
  cantidad: number;
  onCantidadChange: (n: number) => void;
}

export default function ProductDetailContent({
  game,
  taxConfig,
  source,
  cantidad,
  onCantidadChange,
}: ProductDetailContentProps) {
  const precioNum = parsePrice(game.precioFinalVenta);
  const precioFinal = game.descuento > 0 ? precioNum * (1 - game.descuento / 100) : precioNum;
  const mostrarSinImpuestos =
    taxConfig.activoCalculoAutomatico &&
    taxConfig.mostrarPrecioSinImpuestos &&
    precioNum > 0;
  const precioSinImpuestos = mostrarSinImpuestos
    ? formatPrecioConDecimales(calcularPrecioSinImpuestos(precioFinal, taxConfig))
    : "";

  return (
    <div>
      <ProductDetailMain game={game} source={source}>
        {game.disponibleVenta && game.precioFinalVenta && (
          <div className="space-y-4">
            <div>
              {game.descuento > 0 ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-2xl font-bold text-red-500">
                    {formatPrice(precioFinal)}
                  </p>
                  <span className="text-base text-[#9CA3AF] line-through">{formatPrice(precioNum)}</span>
                  <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                    -{game.descuento}%
                  </span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-[#1F2937]">{formatPrice(precioNum)}</p>
              )}
              {precioSinImpuestos && (
                <div className="mt-1.5">
                  <p className="text-xs font-medium text-[#6B7280]">{LEYENDA_SIN_IMPUESTOS}</p>
                  <p className="text-xs text-[#6B7280]">{precioSinImpuestos}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#1F2937]">Cantidad</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
                  aria-label="Disminuir cantidad"
                  className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#FAFAFA] transition-colors"
                >
                  <Minus size={14} className="text-[#6B7280]" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-[#1F2937]">{cantidad}</span>
                <button
                  onClick={() => onCantidadChange(cantidad + 1)}
                  aria-label="Aumentar cantidad"
                  className="w-8 h-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#FAFAFA] transition-colors"
                >
                  <Plus size={14} className="text-[#6B7280]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </ProductDetailMain>
    </div>
  );
}
