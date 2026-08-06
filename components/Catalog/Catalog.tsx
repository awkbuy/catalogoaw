"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import GameCard from "./GameCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { trackMarketingEvent } from "@/lib/marketing";
import { parsePrice } from "@/lib/format";
import type { TaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";

function getTextOnColor(hex: string) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const [lr, lg, lb] = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  const luminance = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  return luminance > 0.2 ? "text-[#0B3B30]" : "text-white";
}

export interface PublicGame {
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
}

interface CatalogProps {
  games: PublicGame[];
  whatsappNumber: string;
  taxConfig: TaxConfig;
  paymentMethods: PublicPaymentMethod[];
  initialCategoria?: string;
  initialQuery?: string;
}

export default function Catalog({ games, whatsappNumber, taxConfig, paymentMethods, initialCategoria, initialQuery }: CatalogProps) {
  const { isLite } = useAdaptive();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeCategory, setActiveCategory] = useState(initialCategoria ?? "Todos");
  const [selectedGame, setSelectedGame] = useState<PublicGame | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleCategoryChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setActiveCategory(detail || "Todos");
    };
    window.addEventListener("categoryChange", handleCategoryChange);
    return () => window.removeEventListener("categoryChange", handleCategoryChange);
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, { nombre: string; color: string; icono: string }>();
    for (const game of games) {
      const cats = game.categorias && game.categorias.length > 0
        ? game.categorias
        : [game.categoria];
      for (const c of cats) {
        if (!map.has(c.nombre)) {
          map.set(c.nombre, c);
        }
      }
    }
    return [{ nombre: "Todos", color: "#31D3A9", icono: "🎲" }, ...map.values()];
  }, [games]);

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter((game) => {
      const gameCats =
        game.categorias && game.categorias.length > 0
          ? game.categorias
          : [game.categoria];
      const matchesCategory =
        activeCategory === "Todos" ||
        gameCats.some((c) => c.nombre === activeCategory);
      const matchesQuery =
        !q ||
        game.nombre.toLowerCase().includes(q) ||
        game.descripcion.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [games, query, activeCategory]);

  const filteredGamesRef = useRef(0);
  useEffect(() => {
    filteredGamesRef.current = filteredGames.length;
  }, [filteredGames.length]);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(() => {
      trackMarketingEvent({
        event: "Search",
        data: {
          search_term: q,
          quantity: filteredGamesRef.current,
          source: "catalog_search",
        },
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const openDetail = (game: PublicGame) => {
    setSelectedGame(game);
    setModalOpen(true);
    trackMarketingEvent({
      event: "ViewContent",
      data: {
        content_ids: [game.id],
        content_name: game.nombre,
        content_category: game.categoria.nombre,
        value: parsePrice(game.precioFinalVenta),
        currency: "ARS",
        source: "catalog_card",
      },
    });
  };

  return (
    <section
      id="catalogo"
      ref={catalogRef}
      className="scroll-mt-24 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Catálogo de juegos
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-text-secondary">
            Buscá el juego ideal por nombre, descripción o categoría
          </p>

          <div className="relative mx-auto mt-6 max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar juego..."
              className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-text shadow-sm outline-none transition-all placeholder:text-text-secondary focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const active = activeCategory === cat.nombre;
              const showEmoji =
                cat.icono &&
                !cat.icono.startsWith("/") &&
                !cat.icono.startsWith("http");
              return (
                <button
                  key={cat.nombre}
                  onClick={() => {
                    if (cat.nombre !== "Todos") {
                      const categoryGames = games.filter((game) => {
                        const gameCats =
                          game.categorias && game.categorias.length > 0
                            ? game.categorias
                            : [game.categoria];
                        return gameCats.some((c) => c.nombre === cat.nombre);
                      });
                      trackMarketingEvent({
                        event: "ViewCategory",
                        data: {
                          content_ids: categoryGames.map((g) => g.id),
                          content_category: cat.nombre,
                          quantity: categoryGames.length,
                          source: "catalog_category",
                        },
                      });
                    }
                    setActiveCategory(cat.nombre);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? `${getTextOnColor(cat.color)} shadow-md`
                      : "border border-border bg-card text-text-secondary hover:border-primary/30 hover:text-text"
                  }`}
                  style={active ? { backgroundColor: cat.color } : undefined}
                >
                  {showEmoji && <span>{cat.icono}</span>}
                  {cat.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {filteredGames.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-2xl">🎲</p>
            <p className="mt-3 text-lg font-semibold text-text">
              No encontramos juegos con ese filtro
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Probá con otra búsqueda o categoría
            </p>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola, estoy buscando un juego en particular.")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackMarketingEvent({
                    event: "ClickWhatsApp",
                    data: { source: "catalog_empty" },
                  })
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[#0B3B30] shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                Consultar por WhatsApp
              </a>
            )}
          </div>
        ) : (
          <Motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
            <AnimatePresence mode={isLite ? undefined : "popLayout"}>
              {filteredGames.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={index}
                  taxConfig={taxConfig}
                  paymentMethods={paymentMethods}
                  onViewDetail={openDetail}
                />
              ))}
            </AnimatePresence>
          </Motion.div>
        )}
      </div>

      <ProductDetailModal
        game={selectedGame}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        taxConfig={taxConfig}
      />
    </section>
  );
}
