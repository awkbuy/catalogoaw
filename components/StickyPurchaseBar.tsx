"use client";

import { ShoppingCart, Zap } from "lucide-react";
import { parsePrice, formatPrice } from "@/lib/format";
import type { ProductDetailGame } from "./ProductDetailMain";

interface StickyPurchaseBarProps {
  game: ProductDetailGame;
  cantidad: number;
  onBuy: () => void;
  onAdded: () => void;
}

export default function StickyPurchaseBar({ game, cantidad, onBuy, onAdded }: StickyPurchaseBarProps) {
  const precioNum = parsePrice(game.precioFinalVenta);
  const precioFinal = game.descuento > 0 ? precioNum * (1 - game.descuento / 100) : precioNum;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-[#6B7280]">
            {cantidad} {cantidad === 1 ? "unidad" : "unidades"}
          </p>
          <p className="text-lg font-bold text-[#1F2937]">{formatPrice(precioFinal * cantidad)}</p>
        </div>
        <button
          onClick={onAdded}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#31D3A9] bg-white px-3 py-2.5 text-xs font-bold text-[#0B3B30] active:scale-[0.98]"
        >
          <ShoppingCart size={16} />
          Agregar
        </button>
        <button
          onClick={onBuy}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#31D3A9] px-4 py-2.5 text-xs font-bold text-[#0B3B30] shadow-md shadow-[#31D3A9]/20 active:scale-[0.98]"
        >
          <Zap size={16} />
          Comprar
        </button>
      </div>
    </div>
  );
}
