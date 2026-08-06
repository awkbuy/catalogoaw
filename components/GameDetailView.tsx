"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ImageWithProgress from "@/components/ImageWithProgress";
import {
  Users,
  Clock,
  Baby,
  MessageCircle,
  ShoppingCart,
  MessageCircleQuestion,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { trackMarketingEvent } from "@/lib/marketing";
import { parsePrice, formatPrice } from "@/lib/format";
import { getYouTubeEmbedUrl } from "@/lib/video";
import {
  LEYENDA_SIN_IMPUESTOS,
  calcularPrecioSinImpuestos,
  formatPrecioConDecimales,
  type TaxConfig,
} from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import type { DiaHorario } from "@/lib/horarios";
import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer";
import ScrollToTop from "@/components/ScrollToTop/ScrollToTop";
import PaymentMethodIcon from "@/components/PaymentMethodIcon";

export interface PublicGameDetail {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  categoria: { nombre: string; icono: string; color: string };
  categorias?: { nombre: string; icono: string; color: string }[];
  jugadoresMin: number;
  jugadoresMax: number;
  duracion: string;
  edad: string;
  dificultad: string;
  imagen: string;
  integrarVideo: boolean;
  videoUrl: string;
  estado: string;
  destacado: boolean;
  nuevo: boolean;
  precioFinalVenta: string;
  descuento: number;
  disponibleVenta: boolean;
  disponibleMesa: boolean;
  imagenAlt: string;
  descripcionAccesible: string;
  resumenIA: string;
}

interface GameDetailViewProps {
  game: PublicGameDetail;
  whatsappNumber: string;
  businessName: string;
  logoUrl: string | null;
  horarios: DiaHorario[];
  taxConfig: TaxConfig;
  paymentMethods: PublicPaymentMethod[];
}

export default function GameDetailView({
  game,
  whatsappNumber,
  businessName,
  logoUrl,
  horarios,
  taxConfig,
  paymentMethods,
}: GameDetailViewProps) {
  const { addItem } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  const precioNum = parsePrice(game.precioFinalVenta);
  const precioFinal =
    game.descuento > 0 ? precioNum * (1 - game.descuento / 100) : precioNum;

  const viewSentRef = useRef(false);
  useEffect(() => {
    if (viewSentRef.current) return;
    viewSentRef.current = true;
    trackMarketingEvent({
      event: "ViewContent",
      data: {
        content_ids: [game.id],
        content_name: game.nombre,
        content_category: game.categoria.nombre,
        value: precioFinal,
        currency: "ARS",
        source: "game_detail",
      },
    });
  }, [game, precioFinal]);
  const embedUrl = game.integrarVideo ? getYouTubeEmbedUrl(game.videoUrl) : null;
  const mostrarSinImpuestos =
    taxConfig.activoCalculoAutomatico &&
    taxConfig.mostrarPrecioSinImpuestos &&
    precioNum > 0;
  const precioSinImpuestos = mostrarSinImpuestos
    ? formatPrecioConDecimales(calcularPrecioSinImpuestos(precioFinal, taxConfig))
    : "";
  const alt = game.imagenAlt || game.descripcionAccesible || game.nombre;
  const promocional = paymentMethods.find((pm) => pm.promocional);

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
    trackMarketingEvent({
      event: "AddToCart",
      data: {
        content_ids: [game.id],
        content_name: game.nombre,
        content_category: game.categoria.nombre,
        value: precioFinal,
        currency: "ARS",
        quantity: cantidad,
        source: "game_detail",
      },
    });
    setCartOpen(true);
    setCantidad(1);
  };

  const whatsappText = `Hola, quisiera consultar por el juego "${game.nombre}".`;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`
    : null;

  return (
    <div id="inicio" className="bg-white min-h-screen">
      <Navbar
        whatsappNumber={whatsappNumber}
        businessName={businessName}
        logoUrl={logoUrl}
        horarios={horarios}
        onCartClick={() => setCartOpen(true)}
        onCartClose={() => setCartOpen(false)}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <nav aria-label="Ruta de navegación" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-text-secondary">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/?categoria=${encodeURIComponent(game.categoria.nombre)}`}
                className="hover:text-primary transition-colors"
              >
                {game.categoria.nombre}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text font-medium">
              {game.nombre}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#E5E7EB]">
            {game.imagen ? (
              <ImageWithProgress
                src={game.imagen}
                alt={alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="absolute inset-0"
                imgClassName="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                {game.categoria.icono || "🎲"}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${game.categoria.color}14`,
                  color: game.categoria.color,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: game.categoria.color }}
                />
                {game.categoria.nombre}
              </span>
              {(game.categorias ?? [])
                .filter((c) => c.nombre !== game.categoria.nombre)
                .map((c) => (
                  <span
                    key={c.nombre}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-secondary"
                  >
                    {c.icono &&
                    !c.icono.startsWith("/") &&
                    !c.icono.startsWith("http")
                      ? `${c.icono} `
                      : ""}
                    {c.nombre}
                  </span>
                ))}
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
              {game.nombre}
            </h1>

            {game.descripcion && (
              <p className="mt-3 text-base leading-relaxed text-text-secondary">
                {game.descripcion}
              </p>
            )}

            {game.descripcionAccesible && (
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {game.descripcionAccesible}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Users, label: `${game.jugadoresMin}-${game.jugadoresMax} jugadores` },
                { icon: Clock, label: game.duracion },
                { icon: Baby, label: `${game.edad} años` },
                { icon: MessageCircle, label: `Dificultad ${game.dificultad}` },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-background p-3 text-center"
                >
                  <Icon size={16} className="text-primary" />
                  <span className="text-xs font-medium text-text-secondary leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {game.disponibleVenta && precioNum > 0 && (
              <div className="mt-6">
                <span className="text-sm text-text-secondary">
                  Precio de venta
                </span>
                {game.descuento > 0 ? (
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <p className="text-3xl font-bold text-red-500">
                      {formatPrice(precioFinal)}
                    </p>
                    <span className="text-lg text-text-secondary line-through">
                      {formatPrice(precioNum)}
                    </span>
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                      -{game.descuento}%
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-3xl font-bold text-text">
                    {formatPrice(precioNum)}
                  </p>
                )}
                {precioSinImpuestos && (
                  <div className="mt-1.5">
                    <p className="text-xs font-medium text-text-secondary">
                      {LEYENDA_SIN_IMPUESTOS}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {precioSinImpuestos}
                    </p>
                  </div>
                )}
              </div>
            )}

            {paymentMethods.length > 0 && (
              <div className="mt-6 space-y-2 rounded-2xl border border-border bg-background p-4">
                {promocional && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5">
                    <MessageCircleQuestion size={13} className="flex-shrink-0 text-primary" />
                    <p className="text-[11px] font-semibold leading-snug text-primary">
                      {promocional.titulo}
                      {promocional.descripcion ? ` — ${promocional.descripcion}` : ""}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {paymentMethods.map((pm) => (
                    <span
                      key={pm.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary"
                      title={pm.descripcion || pm.titulo}
                    >
                      <PaymentMethodIcon icono={pm.icono} size={16} className="text-primary" />
                      {pm.titulo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {game.disponibleVenta && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background transition-colors"
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-text">
                    {cantidad}
                  </span>
                  <button
                    onClick={() => setCantidad(cantidad + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background transition-colors"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-[#0B3B30] shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] sm:flex-none"
                >
                  <ShoppingCart size={16} />
                  Agregar al carrito
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackMarketingEvent({
                      event: "ClickWhatsApp",
                      data: { source: "game_detail" },
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-text shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  Consultar por WhatsApp
                </a>
              )}
              <Link
                href="/#catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-text-secondary transition-colors hover:text-text"
              >
                ← Volver al catálogo
              </Link>
            </div>
          </div>
        </div>

        {embedUrl && (
          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-bold text-text">
              Video de {game.nombre}
            </h2>
            <div className="aspect-video max-w-3xl overflow-hidden rounded-2xl border border-border bg-black">
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
          </section>
        )}

        {game.resumenIA && (
          <section className="mt-12 max-w-3xl">
            <h2 className="mb-3 text-lg font-bold text-text">
              Resumen
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {game.resumenIA}
            </p>
          </section>
        )}
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        whatsappNumber={whatsappNumber}
        paymentMethods={paymentMethods}
      />
      <ScrollToTop />
    </div>
  );
}
