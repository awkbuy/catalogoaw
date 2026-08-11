"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import GameCard from "@/components/Catalog/GameCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { trackMarketingEvent } from "@/lib/marketing";
import type { TaxConfig } from "@/lib/tax";
import type { PublicGame } from "@/components/Catalog/Catalog";
import type { CuotasInfo, PublicShippingZone } from "@/lib/ventas";

interface LandingGridProps {
  games: PublicGame[];
  whatsappNumber: string;
  taxConfig: TaxConfig;
  cuotasInfo: CuotasInfo;
  envioZonas: PublicShippingZone[];
  businessName?: string;
}

export default function LandingGrid({
  games,
  whatsappNumber,
  taxConfig,
  cuotasInfo,
  envioZonas,
  businessName,
}: LandingGridProps) {
  const { isLite } = useAdaptive();
  const [selectedGame, setSelectedGame] = useState<PublicGame | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (games.length === 0) {
    return (
      <section id="catalogo" className="scroll-mt-24 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-16 text-center">
            <p className="text-2xl">🎲</p>
            <p className="mt-3 text-lg font-semibold text-text">
              Esta landing todavía no tiene juegos asignados
            </p>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  "Hola, quiero consultar por juegos de mesa."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackMarketingEvent({
                    event: "ClickWhatsApp",
                    data: { source: "landing_empty" },
                  })
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[#0B3B30] shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  const openDetail = (game: PublicGame) => {
    setSelectedGame(game);
    setModalOpen(true);
    trackMarketingEvent({
      event: "ViewContent",
      data: {
        content_ids: [game.id],
        content_name: game.nombre,
        content_category: game.categoria.nombre,
        value: Number.parseFloat(game.precioFinalVenta) || 0,
        currency: "ARS",
        source: "landing_card",
      },
    });
  };

  return (
    <section id="catalogo" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Juegos de la campaña
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-text-secondary">
            Elegí el tuyo y consultá por WhatsApp o agregalo directo al carrito
          </p>
        </div>

        <Motion.div
          layout
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6"
        >
          <AnimatePresence mode={isLite ? undefined : "popLayout"}>
            {games.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                taxConfig={taxConfig}
                cuotasInfo={cuotasInfo}
                envioZonas={envioZonas}
                businessName={businessName}
                onViewDetail={openDetail}
              />
            ))}
          </AnimatePresence>
        </Motion.div>

        {whatsappNumber && (
          <div className="mt-12 text-center">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                "Hola, vi una campaña y quiero hacer una consulta."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackMarketingEvent({
                  event: "ClickWhatsApp",
                  data: { source: "landing_cta" },
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-[#0B3B30] shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              Consultar por WhatsApp
            </a>
          </div>
        )}
      </div>

      <ProductDetailModal
        game={selectedGame}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        taxConfig={taxConfig}
        cuotasInfo={cuotasInfo}
        envioZonas={envioZonas}
        businessName={businessName}
      />
    </section>
  );
}
