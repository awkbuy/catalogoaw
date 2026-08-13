"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import ProductCard from "@/components/Catalog/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { trackMarketingEvent } from "@/lib/marketing";
import type { TaxConfig } from "@/lib/tax";
import type { PublicProduct } from "@/components/Catalog/Catalog";
import type { CuotasInfo, PublicShippingZone } from "@/lib/ventas";

interface LandingGridProps {
  products: PublicProduct[];
  whatsappNumber: string;
  taxConfig: TaxConfig;
  cuotasInfo: CuotasInfo;
  envioZonas: PublicShippingZone[];
  businessName?: string;
}

export default function LandingGrid({
  products,
  whatsappNumber,
  taxConfig,
  cuotasInfo,
  envioZonas,
  businessName,
}: LandingGridProps) {
  const { isLite } = useAdaptive();
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (products.length === 0) {
    return (
      <section id="catalogo" className="scroll-mt-24 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-16 text-center">
            <p className="text-2xl">🎲</p>
            <p className="mt-3 text-lg font-semibold text-text">
              Esta landing todavía no tiene productos asignados
            </p>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  "Hola, quiero consultar por un producto."
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

  const openDetail = (product: PublicProduct) => {
    setSelectedProduct(product);
    setModalOpen(true);
    trackMarketingEvent({
      event: "ViewContent",
      data: {
        content_ids: [product.id],
        content_name: product.nombre,
        content_category: product.categoria.nombre,
        value: Number.parseFloat(product.precioFinalVenta) || 0,
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
            Productos de la campaña
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
            {products.map((product, index) => (
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
