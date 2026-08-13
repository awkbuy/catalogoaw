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
import { calcularCuotas, resolverEnvio, type CuotasInfo, type PublicShippingZone } from "@/lib/ventas";

export type { ProductDetailProduct } from "./ProductDetailMain";

interface ProductDetailContentProps {
  product: import("./ProductDetailMain").ProductDetailProduct;
  taxConfig: TaxConfig;
  source: string;
  cantidad: number;
  onCantidadChange: (n: number) => void;
  cuotasInfo: CuotasInfo;
  envioZonas: PublicShippingZone[];
  businessName?: string;
}

export default function ProductDetailContent({
  product,
  taxConfig,
  source,
  cantidad,
  onCantidadChange,
  cuotasInfo,
  envioZonas,
  businessName = "Catalogo App",
}: ProductDetailContentProps) {
  const precioNum = parsePrice(product.precioFinalVenta);
  const precioFinal = product.descuento > 0 ? precioNum * (1 - product.descuento / 100) : precioNum;
  const mostrarSinImpuestos =
    taxConfig.activoCalculoAutomatico &&
    taxConfig.mostrarPrecioSinImpuestos &&
    precioNum > 0;
  const precioSinImpuestos = mostrarSinImpuestos
    ? formatPrecioConDecimales(calcularPrecioSinImpuestos(precioFinal, taxConfig))
    : "";
  const cuotas = cuotasInfo ? calcularCuotas(precioFinal, cuotasInfo) : null;
  const envio = resolverEnvio({
    precio: precioFinal,
    envioGratisDelProducto: product.envioGratis,
    zonas: envioZonas,
  });
  const hayRetiro = envioZonas.some((z) => z.active && z.cost === 0);

  return (
    <div>
      <ProductDetailMain product={product} source={source}>
        {product.disponibleVenta && product.precioFinalVenta && (
          <div className="space-y-4">
            <div>
              {product.descuento > 0 ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-2xl font-bold text-red-500">
                    {formatPrice(precioFinal)}
                  </p>
                  <span className="text-base text-[#9CA3AF] line-through">{formatPrice(precioNum)}</span>
                  <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                    -{product.descuento}%
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

            {cuotas && (
              <div className="rounded-lg bg-green-50 px-3 py-2">
                <p className="text-sm font-semibold text-green-600">
                  {cuotas.cuotas} cuotas de {formatPrice(cuotas.valorCuota)}
                </p>
              </div>
            )}

            {envio && (
              <div className="rounded-lg bg-green-50 px-3 py-2">
                {envio.gratis ? (
                  <p className="text-sm font-semibold text-green-600">
                    {envio.zonaGratis
                      ? `Envío gratis a ${envio.zonaGratis}`
                      : "Envío gratis"}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-green-600">
                    {envio.zonaDesde
                      ? `Envío a ${envio.zonaDesde} desde ${formatPrice(envio.desde || 0)}`
                      : `Envío desde ${formatPrice(envio.desde || 0)}`}
                    {envio.freeFrom
                      ? ` · gratis desde ${formatPrice(envio.freeFrom)}`
                      : ""}
                  </p>
                )}
                {envio.zonasConsultar?.map((nombre) => (
                  <p key={nombre} className="text-xs font-medium text-green-700">
                    Envío a {nombre}: consultar monto
                  </p>
                ))}
                {hayRetiro && (
                  <p className="text-xs font-medium text-green-700">
                    Retiro gratis en {businessName}
                  </p>
                )}
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
          </div>
        )}
      </ProductDetailMain>
    </div>
  );
}
