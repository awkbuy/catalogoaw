"use client";

import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import type { TaxConfig } from "@/lib/tax";
import ProductDetailContent, { type ProductDetailGame } from "@/components/ProductDetailContent";

interface ProductDetailModalProps {
  game: ProductDetailGame | null;
  open: boolean;
  onClose: () => void;
  taxConfig: TaxConfig;
}

export default function ProductDetailModal({ game, open, onClose, taxConfig }: ProductDetailModalProps) {
  const { isLite } = useAdaptive();

  if (!game) return null;

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
                onAdded={onClose}
              />
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
