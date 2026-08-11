"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { trackMarketingEvent } from "@/lib/marketing";

export interface CartItem {
  gameId: string;
  nombre: string;
  precio: string;
  precioNum: number;
  imagen: string;
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
  removeItem: (gameId: string) => void;
  updateCantidad: (gameId: string, delta: number) => void;
  updateObservacion: (gameId: string, text: string) => void;
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
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const addItem = useCallback((item: Omit<CartItem, "cantidad" | "observacion">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.gameId === item.gameId);
      if (existing) {
        return prev.map((i) =>
          i.gameId === item.gameId ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...item, cantidad: 1, observacion: "" }];
    });
  }, []);

  const removeItem = useCallback((gameId: string) => {
    const item = items.find((i) => i.gameId === gameId);
    if (item) {
      trackMarketingEvent({
        event: "RemoveFromCart",
        data: {
          content_ids: [item.gameId],
          content_name: item.nombre,
          value: item.precioNum,
          currency: "ARS",
          quantity: item.cantidad,
          source: "cart",
        },
      });
    }
    setItems((prev) => prev.filter((i) => i.gameId !== gameId));
  }, [items]);

  const updateCantidad = useCallback((gameId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.gameId === gameId ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i
        )
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const updateObservacion = useCallback((gameId: string, text: string) => {
    setItems((prev) =>
      prev.map((i) => (i.gameId === gameId ? { ...i, observacion: text } : i))
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
