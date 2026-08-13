"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import ProductCard from "./ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { trackMarketingEvent } from "@/lib/marketing";
import { parsePrice } from "@/lib/format";
import type { TaxConfig } from "@/lib/tax";
import type { CuotasInfo, PublicShippingZone } from "@/lib/ventas";

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

export interface PublicProduct {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  categoria: { nombre: string; icono: string; color: string };
  categorias?: { nombre: string; icono: string; color: string }[];
  imagen: string;
  integrarVideo: boolean;
  videoUrl: string;
  estado: string;
  destacado: boolean;
  nuevo: boolean;
  precioFinalVenta: string;
  descuento: number;
  envioGratis: boolean;
  disponibleVenta: boolean;
}

interface CatalogProps {
  products: PublicProduct[];
  whatsappNumber: string;
  taxConfig: TaxConfig;
  cuotasInfo: CuotasInfo;
  envioZonas: PublicShippingZone[];
  businessName?: string;
}

export default function Catalog({ products, whatsappNumber, taxConfig, cuotasInfo, envioZonas, businessName }: CatalogProps) {
  const { isLite } = useAdaptive();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleCategoryChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setActiveCategory(detail || "Todos");
    };
    const handleQueryChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setQuery(detail || "");
    };
    window.addEventListener("categoryChange", handleCategoryChange);
    window.addEventListener("queryChange", handleQueryChange);
    return () => {
      window.removeEventListener("categoryChange", handleCategoryChange);
      window.removeEventListener("queryChange", handleQueryChange);
    };
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, { nombre: string; color: string; icono: string }>();
    for (const product of products) {
      const cats = product.categorias && product.categorias.length > 0
        ? product.categorias
        : [product.categoria];
      for (const c of cats) {
        if (!map.has(c.nombre)) {
          map.set(c.nombre, c);
        }
      }
    }
    return [{ nombre: "Todos", color: "#31D3A9", icono: "🎲" }, ...map.values()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const productCats =
        product.categorias && product.categorias.length > 0
          ? product.categorias
          : [product.categoria];
      const matchesCategory =
        activeCategory === "Todos" ||
        productCats.some((c) => c.nombre === activeCategory);
      const matchesQuery =
        !q ||
        product.nombre.toLowerCase().includes(q) ||
        product.descripcion.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, activeCategory]);

  const filteredProductsRef = useRef(0);
  useEffect(() => {
    filteredProductsRef.current = filteredProducts.length;
  }, [filteredProducts.length]);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(() => {
      trackMarketingEvent({
        event: "Search",
        data: {
          search_term: q,
          quantity: filteredProductsRef.current,
          source: "catalog_search",
        },
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const openDetail = (product: PublicProduct) => {
    setSelectedProduct(product);
    setModalOpen(true);
    trackMarketingEvent({
      event: "ViewContent",
      data: {
        content_ids: [product.id],
        content_name: product.nombre,
        content_category: product.categoria.nombre,
        value: parsePrice(product.precioFinalVenta),
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
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Catálogo
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-text-secondary">
            Buscá el producto ideal por nombre, descripción o categoría
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
              placeholder="Buscar producto..."
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
                      const categoryProducts = products.filter((product) => {
                        const productCats =
                          product.categorias && product.categorias.length > 0
                            ? product.categorias
                            : [product.categoria];
                        return productCats.some((c) => c.nombre === cat.nombre);
                      });
                      trackMarketingEvent({
                        event: "ViewCategory",
                        data: {
                          content_ids: categoryProducts.map((p) => p.id),
                          content_category: cat.nombre,
                          quantity: categoryProducts.length,
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

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-2xl">🎲</p>
            <p className="mt-3 text-lg font-semibold text-text">
              No encontramos productos con ese filtro
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Probá con otra búsqueda o categoría
            </p>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola, estoy buscando un producto en particular.")}`}
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
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
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
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
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
