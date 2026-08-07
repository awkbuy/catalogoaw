"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProductDetailContent, { type ProductDetailGame } from "@/components/ProductDetailContent";
import { trackMarketingEvent } from "@/lib/marketing";
import { parsePrice } from "@/lib/format";
import type { TaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import type { DiaHorario } from "@/lib/horarios";
import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer";

interface ProductDetailPageProps {
  game: ProductDetailGame;
  whatsappNumber: string;
  businessName: string;
  logoUrl: string | null;
  horarios: DiaHorario[];
  taxConfig: TaxConfig;
  paymentMethods: PublicPaymentMethod[];
}

export default function ProductDetailPage({
  game,
  whatsappNumber,
  businessName,
  logoUrl,
  horarios,
  taxConfig,
  paymentMethods,
}: ProductDetailPageProps) {
  const [cartOpen, setCartOpen] = useState(false);

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

  return (
    <div className="bg-white min-h-screen">
      <Navbar
        whatsappNumber={whatsappNumber}
        businessName={businessName}
        logoUrl={logoUrl}
        horarios={horarios}
        onCartClick={() => setCartOpen(true)}
        onCartClose={() => setCartOpen(false)}
      />

      <main className="mx-auto max-w-lg px-4 pt-24 pb-20">
        <nav aria-label="Ruta de navegación" className="mb-4">
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

        <Link
          href="/#catalogo"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text"
        >
          ← Volver al catálogo
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <ProductDetailContent
            game={game}
            taxConfig={taxConfig}
            source="game_detail"
            onAdded={() => setCartOpen(true)}
          />
        </div>
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        whatsappNumber={whatsappNumber}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
