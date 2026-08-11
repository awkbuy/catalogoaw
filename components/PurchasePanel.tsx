"use client";

import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { trackMarketingEvent } from "@/lib/marketing";
import { parsePrice, formatPrice } from "@/lib/format";
import {
  LEYENDA_SIN_IMPUESTOS,
  calcularPrecioSinImpuestos,
  formatPrecioConDecimales,
  type TaxConfig,
} from "@/lib/tax";
import PaymentMethodIcon from "@/components/PaymentMethodIcon";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import { calcularCuotas, type CuotasInfo } from "@/lib/ventas";
import { flyToCart } from "@/lib/fly-to-cart";
import type { ProductDetailGame } from "./ProductDetailMain";

interface PurchasePanelProps {
  game: ProductDetailGame;
  taxConfig: TaxConfig;
  source: string;
  businessName?: string;
  paymentMethods?: PublicPaymentMethod[];
  cuotasInfo?: CuotasInfo | null;
  cantidad: number;
  onCantidadChange: (n: number) => void;
  onBuy: () => void;
}

export default function PurchasePanel({
  game,
  taxConfig,
  source,
  businessName = "Wolfie Room",
  paymentMethods,
  cuotasInfo,
  cantidad,
  onCantidadChange,
  onBuy,
}: PurchasePanelProps) {
  const { addItem, showCartToast } = useCart();

  const precioNum = parsePrice(game.precioFinalVenta);
  const precioFinal = game.descuento > 0 ? precioNum * (1 - game.descuento / 100) : precioNum;
  const mostrarSinImpuestos =
    taxConfig.activoCalculoAutomatico &&
    taxConfig.mostrarPrecioSinImpuestos &&
    precioNum > 0;
  const precioSinImpuestos = mostrarSinImpuestos
    ? formatPrecioConDecimales(calcularPrecioSinImpuestos(precioFinal, taxConfig))
    : "";
  const cuotas = cuotasInfo ? calcularCuotas(precioFinal, cuotasInfo) : null;

  const addItems = () => {
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
    onCantidadChange(1);
  };

  const handleBuy = (e: React.MouseEvent<HTMLButtonElement>) => {
    addItems();
    flyToCart({
      image: game.imagen,
      from: e.currentTarget,
      onComplete: onBuy,
    });
  };

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    addItems();
    flyToCart({
      image: game.imagen,
      from: e.currentTarget,
      onComplete: showCartToast,
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6B7280]">
        Nuevo · Vendido por <span className="font-semibold text-[#1F2937]">{businessName}</span>
      </p>

      <div>
        {game.descuento > 0 ? (
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-3xl font-bold text-red-500">
              {formatPrice(precioFinal)}
            </p>
            <span className="text-base text-[#9CA3AF] line-through">{formatPrice(precioNum)}</span>
            <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
              -{game.descuento}%
            </span>
          </div>
        ) : (
          <p className="text-3xl font-bold text-[#1F2937]">{formatPrice(precioNum)}</p>
        )}
        {precioSinImpuestos && (
          <div className="mt-1.5">
            <p className="text-xs font-medium text-[#6B7280]">{LEYENDA_SIN_IMPUESTOS}</p>
            <p className="text-xs text-[#6B7280]">{precioSinImpuestos}</p>
          </div>
        )}
      </div>

      {cuotas && (
        <div className="rounded-lg bg-green-50 px-3 py-2">
          <p className="text-sm font-semibold text-green-600">
            {cuotas.cuotas} cuotas de {formatPrice(cuotas.valorCuota)}
          </p>
        </div>
      )}

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

      <div className="flex flex-col gap-2.5">
        <button
          onClick={handleBuy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#31D3A9] px-4 py-3.5 text-sm font-bold text-[#0B3B30] shadow-lg shadow-[#31D3A9]/20 transition-all hover:bg-[#2bc49b] hover:shadow-xl hover:shadow-[#31D3A9]/30 active:scale-[0.98]"
        >
          <Zap size={18} />
          Comprar
        </button>
        <button
          onClick={handleAdd}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#31D3A9] bg-white px-4 py-3 text-sm font-bold text-[#0B3B30] transition-all hover:bg-[#31D3A9]/5 active:scale-[0.98]"
        >
          <ShoppingCart size={18} />
          Agregar al carrito
        </button>
      </div>

      {paymentMethods && paymentMethods.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#E5E7EB] pt-3">
          <span className="text-[11px] font-medium text-[#6B7280]">Medios de pago:</span>
          {paymentMethods.map((pm) => (
            <span
              key={pm.id}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]"
              title={pm.descripcion || pm.titulo}
            >
              <PaymentMethodIcon icono={pm.icono} size={14} className="text-[#31D3A9]" />
              {pm.titulo}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
