"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Motion } from "@/components/motion-wrapper";
import { trackMarketingEvent } from "@/lib/marketing";

export interface CartItem {
  productId: string;
  nombre: string;
  precio: string;
  precioNum: number;
  imagen: string;
  envioGratis: boolean;
  cantidad: number;
  observacion: string;
}

export interface AppliedCoupon {
  codigo: string;
  tipo: "porcentaje" | "monto";
  valor: number;
  minimo: number;
  maximo: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cantidad" | "observacion">) => void;
  removeItem: (productId: string) => void;
  updateCantidad: (productId: string, delta: number) => void;
  updateObservacion: (productId: string, text: string) => void;
  clearCart: () => void;
  coupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  clearCoupon: () => void;
  total: number;
  discount: number;
  finalTotal: number;
  itemCount: number;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  cartToastVisible: boolean;
  showCartToast: () => void;
  hideCartToast: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "wr_cart";

function loadPersistedCart(): { items: CartItem[]; coupon: AppliedCoupon | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      items?: CartItem[];
      coupon?: AppliedCoupon | null;
    };
    if (!parsed || !Array.isArray(parsed.items)) return null;
    const items = parsed.items.filter(
      (i) =>
        i &&
        typeof i.productId === "string" &&
        typeof i.precioNum === "number" &&
        Number.isFinite(i.precioNum)
    );
    const coupon =
      parsed.coupon && typeof parsed.coupon === "object"
        ? (parsed.coupon as AppliedCoupon)
        : null;
    return { items, coupon };
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // eslint-disable react-hooks/set-state-in-effect -- hidratar carrito desde localStorage en mount: no puede ser lazy (rompería la hidratación SSR del badge)
  useEffect(() => {
    const persisted = loadPersistedCart();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación única del carrito desde localStorage en mount
      setItems(persisted.items);
      setCoupon(persisted.coupon);
    }
    setHydrated(true);
  }, []);
  // eslint-enable react-hooks/set-state-in-effect

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ items, coupon })
      );
    } catch {
      // almacenamiento bloqueado; el carrito sigue vivo en memoria
    }
  }, [items, coupon, hydrated]);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const [cartToastVisible, setCartToastVisible] = useState(false);
  const hideCartToast = useCallback(() => setCartToastVisible(false), []);
  const showCartToast = useCallback(() => setCartToastVisible(true), []);

  useEffect(() => {
    if (!cartToastVisible) return;
    const t = setTimeout(hideCartToast, 4000);
    return () => clearTimeout(t);
  }, [cartToastVisible, hideCartToast]);

  const addItem = useCallback((item: Omit<CartItem, "cantidad" | "observacion">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...item, cantidad: 1, observacion: "" }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    const item = items.find((i) => i.productId === productId);
    if (item) {
      trackMarketingEvent({
        event: "RemoveFromCart",
        data: {
          content_ids: [item.productId],
          content_name: item.nombre,
          value: item.precioNum,
          currency: "ARS",
          quantity: item.cantidad,
          source: "cart",
        },
      });
    }
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, [items]);

  const updateCantidad = useCallback((productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i
        )
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const updateObservacion = useCallback((productId: string, text: string) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, observacion: text } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const applyCoupon = useCallback((c: AppliedCoupon) => setCoupon(c), []);
  const clearCoupon = useCallback(() => setCoupon(null), []);

  const total = items.reduce((sum, i) => sum + i.precioNum * i.cantidad, 0);

  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.minimo > 0 && total < coupon.minimo) return 0;
    const base = coupon.tipo === "porcentaje" ? (total * coupon.valor) / 100 : coupon.valor;
    if (coupon.maximo > 0) return Math.min(base, coupon.maximo, total);
    return Math.min(base, total);
  }, [coupon, total]);

  const finalTotal = total - discount;
  const itemCount = items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateCantidad,
        updateObservacion,
        clearCart,
        coupon,
        applyCoupon,
        clearCoupon,
        total,
        discount,
        finalTotal,
        itemCount,
        cartOpen,
        openCart,
        closeCart,
        cartToastVisible,
        showCartToast,
        hideCartToast,
      }}
    >
      {children}
      <AnimatePresence>
        {cartToastVisible && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-4 z-[70]"
          >
            <button
              onClick={() => {
                hideCartToast();
                openCart();
              }}
              aria-label="Ver carrito"
              className="flex items-center gap-2.5 rounded-2xl border border-[#31D3A9]/40 bg-white py-3 pl-4 pr-5 shadow-2xl shadow-black/10 transition-transform active:scale-[0.98]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#31D3A9]/15">
                <Check size={14} className="text-[#31D3A9]" />
              </span>
              <span className="text-sm font-semibold text-[#1F2937]">Agregado al carrito</span>
              <span className="text-sm font-bold text-[#31D3A9]">Ver carrito →</span>
            </button>
          </Motion.div>
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
