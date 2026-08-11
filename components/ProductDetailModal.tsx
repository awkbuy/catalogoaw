"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import { useCart } from "@/lib/cart-context";
import { trackMarketingEvent } from "@/lib/marketing";
import { parsePrice } from "@/lib/format";
import type { TaxConfig } from "@/lib/tax";
import ProductDetailContent, { type ProductDetailGame } from "@/components/ProductDetailContent";
import ShareButton from "@/components/ShareButton";

interface ProductDetailModalProps {
  game: ProductDetailGame | null;
  open: boolean;
  onClose: () => void;
  taxConfig: TaxConfig;
}

export default function ProductDetailModal({ game, open, onClose, taxConfig }: ProductDetailModalProps) {
  const { isLite } = useAdaptive();
  const { addItem, openCart } = useCart();
  const [cantidad, setCantidad] = useState(1);

  if (!game) return null;

  const comprable = game.disponibleVenta && !!game.precioFinalVenta;

  const handleAdd = () => {
    if (!game) return;
    const precioNum = parsePrice(game.precioFinalVenta);
    const precioFinal = game.descuento > 0 ? precioNum * (1 - game.descuento / 100) : precioNum;
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
        source: "product_modal",
      },
    });
    setCantidad(1);
    onClose();
    openCart();
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
              <ProductDetailContent
                game={game}
                taxConfig={taxConfig}
                source="product_modal"
                cantidad={cantidad}
                onCantidadChange={setCantidad}
              />
            </div>

            {comprable && (
              <div className="grid grid-cols-2 gap-3 border-t border-[#E5E7EB] p-4">
                <ShareButton
                  game={game}
                  source="product_modal"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2937] shadow-sm transition-all hover:border-[#31D3A9]/30 hover:shadow-md"
                />
                <button
                  onClick={handleAdd}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#31D3A9] px-4 py-3 text-sm font-semibold text-[#0B3B30] shadow-lg shadow-[#31D3A9]/20 hover:bg-[#2bc49b] hover:shadow-xl hover:shadow-[#31D3A9]/30 active:scale-[0.98] transition-all"
                >
                  <ShoppingCart size={16} />
                  Agregar al carrito {cantidad > 1 && `(${cantidad} unidades)`}
                </button>
              </div>
            )}
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
