"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProductDetailMain, { type ProductDetailProduct } from "@/components/ProductDetailMain";
import PurchasePanel from "@/components/PurchasePanel";
import StickyPurchaseBar from "@/components/StickyPurchaseBar";
import { trackMarketingEvent } from "@/lib/marketing";
import { parsePrice } from "@/lib/format";
import type { TaxConfig } from "@/lib/tax";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import type { DiaHorario } from "@/lib/horarios";
import type { CuotasInfo, PublicShippingZone } from "@/lib/ventas";
import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/lib/cart-context";

interface ProductDetailPageProps {
  product: ProductDetailProduct;
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

export default function ProductDetailPage({
  product,
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
}: ProductDetailPageProps) {
  const { cartOpen, openCart, closeCart } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const inlineBoxRef = useRef<HTMLDivElement | null>(null);

  const precioNum = parsePrice(product.precioFinalVenta);
  const precioFinal =
    product.descuento > 0 ? precioNum * (1 - product.descuento / 100) : precioNum;

  const viewSentRef = useRef(false);
  useEffect(() => {
    if (viewSentRef.current) return;
    viewSentRef.current = true;
    trackMarketingEvent({
      event: "ViewContent",
      data: {
        content_ids: [product.id],
        content_name: product.nombre,
        content_category: product.categoria.nombre,
        value: precioFinal,
        currency: "ARS",
        source: "product_detail",
      },
    });
  }, [product, precioFinal]);

  useEffect(() => {
    const el = inlineBoxRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { rootMargin: "-88px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const esComprable = product.disponibleVenta && !!product.precioFinalVenta;

  return (
    <div className="bg-white min-h-screen">
      <Navbar
        whatsappNumber={whatsappNumber}
        businessName={businessName}
        logoUrl={logoUrl}
        horarios={horarios}
        onCartClick={openCart}
        onCartClose={closeCart}
        hideMobileDock={esComprable}
        direccion={direccion}
        ciudad={ciudad}
      />

      <main className="mx-auto max-w-6xl px-4 pt-24 pb-28 lg:pb-20">
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
                href={`/?categoria=${encodeURIComponent(product.categoria.nombre)}`}
                className="hover:text-primary transition-colors"
              >
                {product.categoria.nombre}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text font-medium">
              {product.nombre}
            </li>
          </ol>
        </nav>

        <Link
          href="/#catalogo"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text"
        >
          ← Volver al catálogo
        </Link>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-8">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <ProductDetailMain product={product} source="product_detail" showShareButton>
                {esComprable && (
                  <div className="lg:hidden" ref={inlineBoxRef}>
                    <PurchasePanel
                      product={product}
                      taxConfig={taxConfig}
                      source="product_detail"
                      businessName={businessName}
                      paymentMethods={paymentMethods}
                      cuotasInfo={cuotasInfo}
                      envioZonas={envioZonas}
                      cantidad={cantidad}
                      onCantidadChange={setCantidad}
                      onBuy={openCart}
                    />
                  </div>
                )}
              </ProductDetailMain>
            </div>
          </div>

          {esComprable && (
            <aside aria-label="Panel de compra" className="hidden lg:block">
              <div className="lg:sticky lg:top-24">
                <PurchasePanel
                  product={product}
                  taxConfig={taxConfig}
                  source="product_detail"
                  businessName={businessName}
                  paymentMethods={paymentMethods}
                  cuotasInfo={cuotasInfo}
                  envioZonas={envioZonas}
                  cantidad={cantidad}
                  onCantidadChange={setCantidad}
                  onBuy={openCart}
                />
              </div>
            </aside>
          )}
        </div>
      </main>

      {esComprable && showSticky && (
        <StickyPurchaseBar product={product} cantidad={cantidad} />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        whatsappNumber={whatsappNumber}
        businessName={businessName}
        paymentMethods={paymentMethods}
        envioZonas={envioZonas}
      />
    </div>
  );
}
