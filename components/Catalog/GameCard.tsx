"use client";

import { Eye, Zap, Truck } from "lucide-react";
import Image from "next/image";
import ImageWithProgress from "@/components/ImageWithProgress";
import type { PublicGame } from "./Catalog";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import { useCart } from "@/lib/cart-context";
import { trackMarketingEvent } from "@/lib/marketing";
import { flyToCart } from "@/lib/fly-to-cart";
import { parsePrice, formatPrice } from "@/lib/format";
import {
  LEYENDA_SIN_IMPUESTOS,
  calcularPrecioSinImpuestos,
  formatPrecioConDecimales,
  type TaxConfig,
} from "@/lib/tax";
import { calcularCuotas, resolverEnvio, type CuotasInfo, type PublicShippingZone } from "@/lib/ventas";

const tagConfig: Record<string, { label: string; className: string }> = {
  jugar: {
    label: "🟢 Para jugar",
    className: "bg-primary/10 text-primary",
  },
  recomendado: {
    label: "⭐ Recomendado",
    className: "bg-amber-50 text-amber-600",
  },
  novedad: {
    label: "🔥 Novedad",
    className: "bg-orange-50 text-orange-500",
  },
  descuento: {
    label: "🏷 Descuento",
    className: "bg-red-50 text-red-600",
  },
};

interface GameCardProps {
  game: PublicGame;
  index: number;
  taxConfig: TaxConfig;
  cuotasInfo: CuotasInfo;
  envioZonas: PublicShippingZone[];
  onViewDetail?: (game: PublicGame) => void;
}

export default function GameCard({ game, index, taxConfig, cuotasInfo, envioZonas, onViewDetail }: GameCardProps) {
  const { isLite } = useAdaptive();
  const { addItem, openCart } = useCart();
  const isAvailable = game.estado === "Disponible";

  const precioNum = parsePrice(game.precioFinalVenta);
  const hasDescuento = game.descuento > 0 && game.disponibleVenta;
  const precioDescuento = hasDescuento ? precioNum * (1 - game.descuento / 100) : precioNum;
  const precioFinal = hasDescuento ? precioDescuento : precioNum;
  const mostrarSinImpuestos =
    taxConfig.activoCalculoAutomatico &&
    taxConfig.mostrarPrecioSinImpuestos &&
    precioNum > 0;
  const precioSinImpuestos = mostrarSinImpuestos
    ? formatPrecioConDecimales(calcularPrecioSinImpuestos(precioFinal, taxConfig))
    : "";
  const cuotas = game.disponibleVenta && cuotasInfo ? calcularCuotas(precioFinal, cuotasInfo) : null;
  const envio = game.disponibleVenta
    ? resolverEnvio({
        precio: precioFinal,
        envioGratisDelJuego: game.envioGratis,
        zonas: envioZonas,
      })
    : null;
  const hayRetiro = envioZonas.some((z) => z.active && z.cost === 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      gameId: game.id,
      nombre: game.nombre,
      precio: formatPrice(hasDescuento ? precioDescuento : precioNum),
      precioNum: hasDescuento ? precioDescuento : precioNum,
      imagen: game.imagen,
      envioGratis: game.envioGratis,
    });
    trackMarketingEvent({
      event: "AddToCart",
      data: {
        content_ids: [game.id],
        content_name: game.nombre,
        content_category: game.categoria.nombre,
        value: hasDescuento ? precioDescuento : precioNum,
        currency: "ARS",
        quantity: 1,
        source: "catalog_quick_add",
      },
    });
    flyToCart({
      image: game.imagen,
      from: e.currentTarget as HTMLElement,
      onComplete: openCart,
    });
  };

  const tags: string[] = [];
  if (game.disponibleMesa) tags.push("jugar");
  if (game.destacado) tags.push("recomendado");
  if (game.nuevo) tags.push("novedad");
  if (hasDescuento) tags.push("descuento");

  return (
    <Motion.article
      layout
      initial={{ opacity: 0, y: isLite ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: isLite ? 0 : index * 0.05 }}
      whileHover={isLite ? undefined : { y: -4 }}
      onClick={() => onViewDetail?.(game)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {game.imagen ? (
          <ImageWithProgress
            src={game.imagen}
            alt={game.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            className="absolute inset-0"
            imgClassName="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-3xl">
              {game.categoria.icono &&
              (game.categoria.icono.startsWith("/") || game.categoria.icono.startsWith("http")) ? (
                <Image src={game.categoria.icono} alt="" width={40} height={40} className="object-contain" />
              ) : (
                game.categoria.icono || "🎲"
              )}
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              isAvailable
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isAvailable ? "bg-primary" : "bg-secondary"
              }`}
            />
            {game.estado}
          </span>
        </div>

        {hasDescuento && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-lg">
              -{game.descuento}%
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-text shadow-sm">
            {game.categoria.nombre}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 truncate text-lg font-bold text-text">{game.nombre}</h3>

        {game.descripcion && (
          <p className="mb-3 line-clamp-2 text-sm text-text-secondary">
            {game.descripcion}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const config = tagConfig[tag];
              return config ? (
                <span
                  key={tag}
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${config.className}`}
                >
                  {config.label}
                </span>
              ) : null;
            })}
          </div>
        )}

        {game.disponibleVenta && (
          <div className="mt-auto mb-4">
            <div className="flex flex-wrap items-baseline gap-2">
              {hasDescuento ? (
                <>
                  <span className="text-3xl font-bold text-red-500">
                    {formatPrice(precioDescuento)}
                  </span>
                  <span className="text-base text-text-secondary line-through">
                    {formatPrice(precioNum)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-text">
                  {formatPrice(precioNum)}
                </span>
              )}
            </div>

            {precioSinImpuestos && (
              <div className="mt-1">
                <p className="text-xs font-medium text-text-secondary">
                  {LEYENDA_SIN_IMPUESTOS}
                </p>
                <p className="text-xs text-text-secondary">{precioSinImpuestos}</p>
              </div>
            )}

            {cuotas && (
              <p className="mt-1 text-sm font-semibold text-green-600">
                {cuotas.cuotas} cuotas de {formatPrice(cuotas.valorCuota)}
              </p>
            )}

            {envio && (
              <div className="mt-1.5 space-y-0.5">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                  <Truck size={15} className="flex-shrink-0" />
                  {envio.gratis
                    ? envio.zonaGratis
                      ? `Envío gratis a ${envio.zonaGratis}`
                      : "Envío gratis"
                    : `Envío desde ${formatPrice(envio.desde || 0)}`}
                  {!envio.gratis && envio.freeFrom
                    ? ` · gratis desde ${formatPrice(envio.freeFrom)}`
                    : ""}
                </p>
                {envio.hayConsultar && (
                  <p className="text-xs font-medium text-green-700">
                    Resto del país: consultar monto de envío
                  </p>
                )}
                {hayRetiro && (
                  <p className="text-xs font-medium text-green-700">
                    Retiro gratis en Wolfie Room
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {game.disponibleVenta ? (
          <button
            onClick={handleQuickAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-[#0B3B30] shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap size={16} />
            Comprar
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail?.(game);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-text shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
          >
            <Eye size={16} />
            Ver detalle
          </button>
        )}
      </div>
    </Motion.article>
  );
}
