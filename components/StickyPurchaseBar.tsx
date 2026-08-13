"use client";

import { ShoppingCart, Zap } from "lucide-react";
import { parsePrice, formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { trackMarketingEvent } from "@/lib/marketing";
import { flyToCart } from "@/lib/fly-to-cart";
import type { ProductDetailProduct } from "./ProductDetailMain";

interface StickyPurchaseBarProps {
  product: ProductDetailProduct;
  cantidad: number;
}

export default function StickyPurchaseBar({ product, cantidad }: StickyPurchaseBarProps) {
  const { addItem, openCart, showCartToast } = useCart();
  const precioNum = parsePrice(product.precioFinalVenta);
  const precioFinal = product.descuento > 0 ? precioNum * (1 - product.descuento / 100) : precioNum;

  const addItems = () => {
    for (let i = 0; i < cantidad; i++) {
      addItem({
        productId: product.id,
        nombre: product.nombre,
        precio: product.precioFinalVenta,
        precioNum,
        imagen: product.imagen,
        envioGratis: product.envioGratis,
      });
    }
    trackMarketingEvent({
      event: "AddToCart",
      data: {
        content_ids: [product.id],
        content_name: product.nombre,
        content_category: product.categoria.nombre,
        value: precioFinal,
        currency: "ARS",
        quantity: cantidad,
        source: "product_detail_sticky",
      },
    });
  };

  const handleAgregar = (e: React.MouseEvent<HTMLButtonElement>) => {
    addItems();
    flyToCart({
      image: product.imagen,
      from: e.currentTarget,
      onComplete: showCartToast,
    });
  };

  const handleComprar = (e: React.MouseEvent<HTMLButtonElement>) => {
    addItems();
    flyToCart({
      image: product.imagen,
      from: e.currentTarget,
      onComplete: openCart,
    });
  };

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
          onClick={handleAgregar}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#31D3A9] bg-white px-3 py-2.5 text-xs font-bold text-[#0B3B30] active:scale-[0.98]"
        >
          <ShoppingCart size={16} />
          Agregar
        </button>
        <button
          onClick={handleComprar}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#31D3A9] px-4 py-2.5 text-xs font-bold text-[#0B3B30] shadow-md shadow-[#31D3A9]/20 active:scale-[0.98]"
        >
          <Zap size={16} />
          Comprar
        </button>
      </div>
    </div>
  );
}
