"use client";

import { Users, Clock, Baby, Eye, ShoppingCart, BadgePercent } from "lucide-react";
import Image from "next/image";
import ImageWithProgress from "@/components/ImageWithProgress";
import type { PublicGame } from "./Catalog";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import { useCart } from "@/lib/cart-context";
import { parsePrice, formatPrice } from "@/lib/format";
import PaymentMethodIcon from "@/components/PaymentMethodIcon";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import {
  LEYENDA_SIN_IMPUESTOS,
  calcularPrecioSinImpuestos,
  formatPrecioConDecimales,
  type TaxConfig,
} from "@/lib/tax";

const tagConfig: Record<string, { label: string; className: string }> = {
  jugar: {
    label: "🟢 Para jugar",
    className: "bg-primary/10 text-primary",
  },
  compra: {
    label: "🛍 Disponible para compra",
    className: "bg-secondary/10 text-secondary",
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
  paymentMethods: PublicPaymentMethod[];
  onViewDetail?: (game: PublicGame) => void;
}

export default function GameCard({ game, index, taxConfig, paymentMethods, onViewDetail }: GameCardProps) {
  const { isLite } = useAdaptive();
  const { addItem } = useCart();
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

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      gameId: game.id,
      nombre: game.nombre,
      precio: formatPrice(hasDescuento ? precioDescuento : precioNum),
      precioNum: hasDescuento ? precioDescuento : precioNum,
      imagen: game.imagen,
    });
  };

  const tags: string[] = [];
  if (game.disponibleMesa) tags.push("jugar");
  if (game.disponibleVenta) tags.push("compra");
  if (game.destacado) tags.push("recomendado");
  if (game.nuevo) tags.push("novedad");
  if (hasDescuento) tags.push("descuento");

  const promocional = paymentMethods.find((pm) => pm.promocional);

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
        <h3 className="mb-1 text-lg font-bold text-text">{game.nombre}</h3>

        {game.descripcion && (
          <p className="mb-3 line-clamp-2 text-sm text-text-secondary">
            {game.descripcion}
          </p>
        )}

        {(() => {
          const extra =
            game.categorias && game.categorias.length > 0
              ? game.categorias.filter((c) => c.nombre !== game.categoria.nombre)
              : [];
          if (extra.length === 0) return null;
          return (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {extra.map((c) => (
                <span
                  key={c.nombre}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
                >
                  {c.icono && !c.icono.startsWith("/") && !c.icono.startsWith("http")
                    ? `${c.icono} `
                    : ""}
                  {c.nombre}
                </span>
              ))}
            </div>
          );
        })()}

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

        <div className="mb-5 mt-auto grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-background p-2">
            <Users size={14} className="text-primary" />
            <span className="text-xs font-medium text-text-secondary">
              {game.jugadoresMin}-{game.jugadoresMax}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-background p-2">
            <Clock size={14} className="text-primary" />
            <span className="text-xs font-medium text-text-secondary">
              {game.duracion}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-background p-2">
            <Baby size={14} className="text-primary" />
            <span className="text-xs font-medium text-text-secondary">
              {game.edad}
            </span>
          </div>
        </div>

        {game.disponibleVenta && (
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              {hasDescuento ? (
                <>
                  <span className="text-lg font-bold text-red-500">
                    {formatPrice(precioDescuento)}
                  </span>
                  <span className="text-sm text-text-secondary line-through">
                    {formatPrice(precioNum)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-text">
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
          </div>
        )}

        {game.disponibleVenta && paymentMethods.length > 0 && (
          <div className="mb-3 space-y-2 rounded-xl border border-border bg-background p-3">
            {promocional && (
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5">
                <BadgePercent size={13} className="flex-shrink-0 text-primary" />
                <p className="text-[11px] font-semibold leading-snug text-primary">
                  {promocional.titulo}
                  {promocional.descripcion ? ` — ${promocional.descripcion}` : ""}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {paymentMethods.map((pm) => (
                <span
                  key={pm.id}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-secondary"
                  title={pm.descripcion || pm.titulo}
                >
                  <PaymentMethodIcon icono={pm.icono} size={16} className="text-primary" />
                  {pm.titulo}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail?.(game);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-text shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
          >
            <Eye size={16} />
            Ver detalle
          </button>
          {game.disponibleVenta && (
            <button
              onClick={handleQuickAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-[#0B3B30] shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </Motion.article>
  );
}
