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
import LandingHero from "./LandingHero";
import LandingGrid from "./LandingGrid";
import type { PublicGame } from "@/components/Catalog/Catalog";

interface LandingPageProps {
  games: PublicGame[];
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
}

export default function LandingPage({
  games,
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
}: LandingPageProps) {
  return (
    <CartProvider>
      <LandingContent
        games={games}
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
      />
    </CartProvider>
  );
}

function LandingContent({
  games,
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
              games={games}
              whatsappNumber={whatsappNumber}
              taxConfig={taxConfig}
              paymentMethods={paymentMethods}
            />
          </ErrorBoundary>
        </main>
      </div>
      <ErrorBoundary sectionName="CartDrawer" fallback={<div />}>
        <CartDrawer
          open={cartOpen}
          onClose={closeCart}
          whatsappNumber={whatsappNumber}
          paymentMethods={paymentMethods}
        />
      </ErrorBoundary>
    </>
  );
}
