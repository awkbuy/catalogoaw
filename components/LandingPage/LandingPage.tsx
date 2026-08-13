"use client";

import { useEffect, useRef } from "react";
import { CartProvider, useCart } from "@/lib/cart-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer";
import { trackMarketingEvent } from "@/lib/marketing";
import type { DiaHorario } from "@/lib/horarios";
import type { TaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import type { CuotasInfo, PublicShippingZone } from "@/lib/ventas";
import LandingHero from "./LandingHero";
import LandingGrid from "./LandingGrid";
import type { PublicProduct } from "@/components/Catalog/Catalog";

interface LandingPageProps {
  products: PublicProduct[];
  slug: string;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  bannerColor: string;
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
}

export default function LandingPage({
  products,
  slug,
  title,
  description,
  heroTitle,
  heroDescription,
  heroImage,
  bannerColor,
  whatsappNumber,
  businessName,
  logoUrl,
  horarios,
  taxConfig,
  paymentMethods,
  cuotasInfo,
  envioZonas,
  direccion,
  ciudad,
}: LandingPageProps) {
  return (
    <CartProvider>
      <LandingContent
        products={products}
        slug={slug}
        title={title}
        description={description}
        heroTitle={heroTitle}
        heroDescription={heroDescription}
        heroImage={heroImage}
        bannerColor={bannerColor}
        whatsappNumber={whatsappNumber}
        businessName={businessName}
        logoUrl={logoUrl}
        horarios={horarios}
        taxConfig={taxConfig}
        paymentMethods={paymentMethods}
        cuotasInfo={cuotasInfo}
        envioZonas={envioZonas}
        direccion={direccion}
        ciudad={ciudad}
      />
    </CartProvider>
  );
}

function LandingContent({
  products,
  slug,
  title,
  description,
  heroTitle,
  heroDescription,
  heroImage,
  bannerColor,
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
}: LandingPageProps) {
  const { cartOpen, openCart, closeCart } = useCart();

  const pageViewSentRef = useRef(false);
  useEffect(() => {
    if (pageViewSentRef.current) return;
    pageViewSentRef.current = true;
    trackMarketingEvent({
      event: "PageView",
      data: {
        path: window.location.pathname + window.location.search,
        source: `landing:${slug}`,
      },
    });
  }, [slug]);

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
      <div className="pb-20 md:pb-0">
        <ErrorBoundary sectionName="LandingHero" fallback={<div />}>
          <LandingHero
            title={heroTitle}
            description={heroDescription}
            image={heroImage || undefined}
            bannerColor={bannerColor}
            fallbackTitle={title}
            fallbackDescription={description}
          />
        </ErrorBoundary>
        <main>
          <ErrorBoundary sectionName="LandingGrid" fallback={<div />}>
            <LandingGrid
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
