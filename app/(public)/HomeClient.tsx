"use client";

import { useEffect, useRef } from "react";
import { CartProvider, useCart } from "@/lib/cart-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar/Navbar";
import HeroCategories from "@/components/HeroCategories/HeroCategories";
import AdCtaBanner from "@/components/AdCtaBanner";
import Catalog from "@/components/Catalog/Catalog";
import CartDrawer from "@/components/CartDrawer";
import { trackMarketingEvent } from "@/lib/marketing";
import type { DiaHorario } from "@/lib/horarios";
import type { TaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import type { CuotasInfo, PublicShippingZone } from "@/lib/ventas";

interface PublicProduct {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  categoria: { nombre: string; icono: string; color: string };
  categorias: { nombre: string; icono: string; color: string }[];
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

interface Category {
  id: string;
  nombre: string;
  icono: string | null;
  color: string;
  tags: string;
  _count: { products: number };
}

export default function HomeClient(props: {
  products: PublicProduct[];
  categories: Category[];
  whatsappNumber: string;
  businessName: string;
  logoUrl: string | null;
  horarios: DiaHorario[];
  taxConfig: TaxConfig;
  paymentMethods: PublicPaymentMethod[];
  cuotasInfo: CuotasInfo;
  envioZonas: PublicShippingZone[];
  direccion?: string;
  ciudad?: string;
}) {
  return (
    <CartProvider>
      <HomeContent {...props} />
    </CartProvider>
  );
}

function HomeContent({
  products,
  categories,
  whatsappNumber,
  businessName,
  logoUrl,
  horarios,
  taxConfig,
  paymentMethods,
  cuotasInfo,
  envioZonas,
  direccion = "",
  ciudad = "",
}: {
  products: PublicProduct[];
  categories: Category[];
  whatsappNumber: string;
  businessName: string;
  logoUrl: string | null;
  horarios: DiaHorario[];
  taxConfig: TaxConfig;
  paymentMethods: PublicPaymentMethod[];
  cuotasInfo: CuotasInfo;
  envioZonas: PublicShippingZone[];
  direccion?: string;
  ciudad?: string;
}) {
  const { cartOpen, openCart, closeCart } = useCart();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("categoria");
    const q = params.get("q");
    if (cat) window.dispatchEvent(new CustomEvent("categoryChange", { detail: cat }));
    if (q) window.dispatchEvent(new CustomEvent("queryChange", { detail: q }));
  }, []);

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
    <>
      <Navbar
        whatsappNumber={whatsappNumber}
        businessName={businessName}
        logoUrl={logoUrl}
        horarios={horarios}
        onCartClick={openCart}
        onCartClose={closeCart}
        direccion={direccion}
        ciudad={ciudad}
      />
      <div className="pb-24 md:pb-0">
        <AdCtaBanner />
        <ErrorBoundary sectionName="HeroCategories" fallback={<div />}>
          <HeroCategories categories={categories} logoUrl={logoUrl} />
        </ErrorBoundary>
        <main>
          <ErrorBoundary sectionName="Catalog" fallback={<div />}>
            <Catalog
              products={products}
              whatsappNumber={whatsappNumber}
              taxConfig={taxConfig}
              cuotasInfo={cuotasInfo}
              envioZonas={envioZonas}
              businessName={businessName}
            />
          </ErrorBoundary>
        </main>
      </div>
      <ErrorBoundary sectionName="CartDrawer" fallback={<div />}>
        <CartDrawer
          open={cartOpen}
          onClose={closeCart}
          whatsappNumber={whatsappNumber}
          businessName={businessName}
          paymentMethods={paymentMethods}
          envioZonas={envioZonas}
        />
      </ErrorBoundary>
    </>
  );
}
