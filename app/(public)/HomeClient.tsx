"use client";

import { useState, useEffect, useRef } from "react";
import { CartProvider } from "@/lib/cart-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar/Navbar";
import HeroCategories from "@/components/HeroCategories/HeroCategories";
import Catalog from "@/components/Catalog/Catalog";
import CartDrawer from "@/components/CartDrawer";
import { trackMarketingEvent } from "@/lib/marketing";
import type { DiaHorario } from "@/lib/horarios";
import type { TaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";

interface PublicGame {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  categoria: { nombre: string; icono: string; color: string };
  categorias: { nombre: string; icono: string; color: string }[];
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

interface Category {
  id: string;
  nombre: string;
  icono: string | null;
  color: string;
  tags: string;
  _count: { games: number };
}

export default function HomeClient({
  games,
  categories,
  whatsappNumber,
  businessName,
  logoUrl,
  horarios,
  taxConfig,
  paymentMethods,
  initialCategoria,
  initialQuery,
}: {
  games: PublicGame[];
  categories: Category[];
  whatsappNumber: string;
  businessName: string;
  logoUrl: string | null;
  horarios: DiaHorario[];
  taxConfig: TaxConfig;
  paymentMethods: PublicPaymentMethod[];
  initialCategoria?: string;
  initialQuery?: string;
}) {
  const [cartOpen, setCartOpen] = useState(false);

  const pageViewSentRef = useRef(false);
  useEffect(() => {
    if (pageViewSentRef.current) return;
    pageViewSentRef.current = true;
    trackMarketingEvent({
      event: "PageView",
      data: {
        path: window.location.pathname + window.location.search,
        source: "home",
      },
    });
  }, []);

  return (
    <CartProvider>
      <Navbar
        whatsappNumber={whatsappNumber}
        businessName={businessName}
        logoUrl={logoUrl}
        horarios={horarios}
        onCartClick={() => setCartOpen(true)}
        onCartClose={() => setCartOpen(false)}
      />
      <div className="pb-20 md:pb-0">
        <ErrorBoundary sectionName="HeroCategories" fallback={<div />}>
          <HeroCategories categories={categories} logoUrl={logoUrl} />
        </ErrorBoundary>
        <main>
          <ErrorBoundary sectionName="Catalog" fallback={<div />}>
            <Catalog
              games={games}
              whatsappNumber={whatsappNumber}
              taxConfig={taxConfig}
              paymentMethods={paymentMethods}
              initialCategoria={initialCategoria}
              initialQuery={initialQuery}
            />
          </ErrorBoundary>
        </main>
      </div>
      <ErrorBoundary sectionName="CartDrawer" fallback={<div />}>
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          whatsappNumber={whatsappNumber}
          paymentMethods={paymentMethods}
        />
      </ErrorBoundary>
    </CartProvider>
  );
}
