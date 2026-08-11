"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  Check,
  Loader2,
  Wallet,
  ArrowLeft,
  ArrowRight,
  Truck,
} from "lucide-react";
import ImageWithProgress from "@/components/ImageWithProgress";
import { useCart } from "@/lib/cart-context";
import { trackMarketingEvent } from "@/lib/marketing";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import { formatPrice } from "@/lib/format";
import { sileo } from "sileo";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PaymentMethodIcon from "@/components/PaymentMethodIcon";
import { useProgress } from "@/lib/progress-context";
import { calcularEnvioCarrito, type PublicShippingZone } from "@/lib/ventas";
import type { PublicPaymentMethod } from "@/lib/payment-methods";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  whatsappNumber: string;
  paymentMethods: PublicPaymentMethod[];
  envioZonas?: PublicShippingZone[];
}

const deliveryOptions = [
  { value: "retiro", label: "Lo retiro personalmente" },
  { value: "envio", label: "Necesito que me lo envíen" },
];

const paymentOptions = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta de débito o crédito en cuotas" },
  { value: "transferencia", label: "Transferencia" },
];

const stepLabels = ["Pedido", "Tus datos", "Entrega y pago"];

type Entrega = "" | "retiro" | "envio";

const CHECKOUT_STORAGE_KEY = "wr_checkout_datos";

function getCheckoutDatos(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // storage malformado: se arranca limpio
  }
  return {};
}

export default function CartDrawer({
  open,
  onClose,
  whatsappNumber,
  paymentMethods,
  envioZonas = [],
}: CartDrawerProps) {
  const { start, done } = useProgress();
  const { isLite } = useAdaptive();
  const {
    items,
    removeItem,
    updateCantidad,
    updateObservacion,
    total,
    discount,
    finalTotal,
    itemCount,
    coupon,
    applyCoupon,
    clearCoupon,
  } = useCart();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nombre, setNombre] = useState(() => getCheckoutDatos().nombre || "");
  const [telefono, setTelefono] = useState(() => getCheckoutDatos().telefono || "");
  const [entrega, setEntrega] = useState<Entrega>(() => {
    const e = getCheckoutDatos().entrega;
    return e === "retiro" || e === "envio" ? e : "";
  });
  const [zonaId, setZonaId] = useState(() => getCheckoutDatos().zonaId || "");
  const [pago, setPago] = useState(() => getCheckoutDatos().pago || "");
  const [cupon, setCupon] = useState("");
  const [aplicandoCupon, setAplicandoCupon] = useState(false);
  const [direccion, setDireccion] = useState(() => getCheckoutDatos().direccion || "");
  const [ciudad, setCiudad] = useState(() => getCheckoutDatos().ciudad || "");
  const [provincia, setProvincia] = useState(() => getCheckoutDatos().provincia || "");
  const [codigoPostal, setCodigoPostal] = useState(() => getCheckoutDatos().codigoPostal || "");
  const [referencia, setReferencia] = useState(() => getCheckoutDatos().referencia || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const prevOpenRef = useRef(false);
  const initiateFiredRef = useRef(false);
  const addPaymentFiredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({
          nombre,
          telefono,
          entrega,
          zonaId,
          pago,
          direccion,
          ciudad,
          provincia,
          codigoPostal,
          referencia,
        })
      );
    } catch {
      // almacenamiento bloqueado; el formulario sigue en memoria
    }
  }, [
    nombre,
    telefono,
    entrega,
    zonaId,
    pago,
    direccion,
    ciudad,
    provincia,
    codigoPostal,
    referencia,
  ]);

  useEffect(() => {
    if (open && !prevOpenRef.current && itemCount > 0) {
      trackMarketingEvent({
        event: "ViewCart",
        data: { quantity: itemCount, source: "cart_drawer" },
      });
      setStep(1);
      initiateFiredRef.current = false;
      addPaymentFiredRef.current = false;
    }
    prevOpenRef.current = open;
  }, [open, itemCount]);

  const zonasActivas = envioZonas.filter((z) => z.active);
  const todosEnvioGratis = items.length > 0 && items.every((i) => i.envioGratis);
  const envio = calcularEnvioCarrito({
    subtotal: total,
    entrega: entrega === "retiro" || entrega === "envio" ? entrega : null,
    zonaId: zonaId || null,
    zonas: envioZonas,
    todosEnvioGratis,
  });
  const totalConEnvio = finalTotal + (envio?.monto ?? 0);

  const handleFieldChange = (
    key: string,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  const handleAplicarCupon = async () => {
    const code = cupon.trim();
    if (!code) return;
    setAplicandoCupon(true);
    start();
    try {
      const res = await fetch("/api/cupones/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: code, subtotal: total }),
      });
      const data = await res.json();
      if (!res.ok) {
        sileo.error({ title: data.error || "Cupón inválido" });
        return;
      }
      applyCoupon({
        codigo: data.codigo,
        tipo: data.tipo,
        valor: data.valor,
        minimo: data.minimo,
        maximo: data.maximo,
      });
      setCupon("");
      sileo.success({ title: "Cupón aplicado" });
    } catch {
      sileo.error({ title: "Error al aplicar el cupón" });
    } finally {
      done();
      setAplicandoCupon(false);
    }
  };

  const validarDatos = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      errs.nombre = "Ingresá tu nombre y apellido";
    } else if (nombreLimpio.length < 3) {
      errs.nombre = "El nombre debe tener al menos 3 caracteres";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' .-]+$/.test(nombreLimpio)) {
      errs.nombre = "El nombre solo puede contener letras";
    }

    const telefonoLimpio = telefono.replace(/[^\d+]/g, "");
    if (!telefono.trim()) {
      errs.telefono = "Ingresá tu teléfono";
    } else if (!/^\+?\d{7,15}$/.test(telefonoLimpio)) {
      errs.telefono = "Ingresá un teléfono válido (ej: 2611234567)";
    }

    return errs;
  };

  const validarEntregaPago = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (!entrega) {
      errs.entrega = "Seleccioná una forma de entrega";
    } else if (entrega === "envio") {
      if (zonasActivas.length === 0) {
        errs.entrega = "No hay zonas de envío disponibles";
      } else if (!zonaId) {
        errs.zona = "Seleccioná la zona de envío";
      }
      if (!direccion.trim()) {
        errs.direccion = "Ingresá la dirección";
      } else if (direccion.trim().length < 5) {
        errs.direccion = "Dirección demasiado corta";
      }
      if (!ciudad.trim()) errs.ciudad = "Ingresá la ciudad";
      if (!provincia.trim()) errs.provincia = "Ingresá la provincia";
      const cp = codigoPostal.trim();
      if (!cp) {
        errs.codigoPostal = "Ingresá el código postal";
      } else if (!/^\d{4}$/.test(cp)) {
        errs.codigoPostal = "Debe tener 4 números (ej: 5500)";
      }
    }

    if (!pago) {
      errs.pago = "Seleccioná una forma de pago";
    }

    return errs;
  };

  const goToStep = (next: 1 | 2 | 3) => {
    if (next === 2 && step === 1 && !initiateFiredRef.current && items.length > 0) {
      initiateFiredRef.current = true;
      trackMarketingEvent({
        event: "InitiateCheckout",
        data: {
          content_ids: items.map((i) => i.gameId),
          content_name: items[0]?.nombre,
          value: finalTotal,
          currency: "ARS",
          quantity: itemCount,
          source: "cart_drawer",
        },
      });
    }
    if (next === 3 && step === 2 && !addPaymentFiredRef.current && items.length > 0) {
      addPaymentFiredRef.current = true;
      trackMarketingEvent({
        event: "AddPaymentInfo",
        data: {
          content_ids: items.map((i) => i.gameId),
          content_name: items[0]?.nombre,
          value: totalConEnvio,
          currency: "ARS",
          quantity: itemCount,
          source: "cart_drawer",
        },
      });
    }
    setStep(next);
    setErrors({});
  };

  const handleContinuar = () => {
    if (step === 1) {
      goToStep(2);
      return;
    }
    const errs = validarDatos();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      sileo.error({ title: "Revisá los campos marcados en rojo" });
      return;
    }
    goToStep(3);
  };

  const handleConfirmar = () => {
    if (!whatsappNumber) {
      sileo.error({ title: "El número de WhatsApp no está configurado" });
      return;
    }

    const errs = validarEntregaPago();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      sileo.error({ title: "Revisá los campos marcados en rojo" });
      return;
    }

    trackMarketingEvent({
      event: "ClickWhatsApp",
      data: { source: "cart_drawer" },
    });

    const zona = envio?.zona ?? null;

    let message = "Hola, quisiera hacer un pedido:\n\n";
    message += "🛒 *Productos:*\n";
    items.forEach((item) => {
      message += `- ${item.nombre} x ${item.cantidad} = ${formatPrice(item.precioNum * item.cantidad)}\n`;
      if (item.observacion) message += `  _Obs: ${item.observacion}_\n`;
    });
    message += `\n*Subtotal: ${formatPrice(total)}*\n`;
    if (coupon) {
      message += `*Cupón ${coupon.codigo}: -${formatPrice(discount)}*\n`;
    }
    if (entrega === "envio" && envio) {
      if (envio.gratis) {
        message += `*Envío: gratis${zona ? ` (${zona.name})` : ""}*\n`;
      } else if (envio.motivo === "consultar") {
        message += `*Envío (${zona?.name ?? "Envío"}): consultar monto*\n`;
      } else {
        message += `*Envío (${zona?.name ?? "Envío"}): ${formatPrice(envio.monto)}*\n`;
      }
    } else if (entrega === "retiro") {
      message += "*Retiro: gratis*\n";
    }
    message += `*Total: ${formatPrice(totalConEnvio)}${
      envio?.motivo === "consultar" ? " (envío a confirmar)" : ""
    }*\n\n`;
    message += "📋 *Datos:*\n";
    message += `Nombre: ${nombre.trim()}\n`;
    message += `Teléfono: ${telefono.trim()}\n`;
    message += `Entrega: ${deliveryOptions.find((o) => o.value === entrega)?.label || "No especificado"}${entrega === "envio" && zona ? ` (${zona.name})` : ""}\n`;
    if (entrega === "envio") {
      message += `Dirección: ${[direccion.trim(), ciudad.trim(), provincia.trim()].filter(Boolean).join(", ")}\n`;
      if (codigoPostal.trim()) message += `Código postal: ${codigoPostal.trim()}\n`;
      if (referencia.trim()) message += `Referencia: ${referencia.trim()}\n`;
    }
    message += `Pago: ${paymentOptions.find((o) => o.value === pago)?.label || "No especificado"}\n`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-50 ${isLite ? "bg-black/50" : "bg-black/40 backdrop-blur-sm"}`}
            onClick={onClose}
          />
          <Motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={isLite ? { duration: 0.2 } : { type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#1F2937]" />
                <h2 className="text-lg font-bold text-[#1F2937]">Carrito</h2>
                {itemCount > 0 && (
                  <span className="text-sm text-[#6B7280]">({itemCount} {itemCount === 1 ? "producto" : "productos"})</span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar carrito"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
              >
                <X size={18} className="text-[#6B7280]" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-5">
                <ShoppingBag size={48} className="text-[#E5E7EB]" />
                <p className="text-[#1F2937] font-medium">Tu carrito está vacío</p>
                <p className="text-sm text-[#6B7280]">Agregá productos desde el catálogo</p>
              </div>
            ) : (
              <>
                <div className="px-5 pt-4 pb-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1F2937]">Paso {step} de 3</span>
                    <span className="text-xs font-medium text-[#9CA3AF]">{stepLabels[step - 1]}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {([1, 2, 3] as const).map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          s <= step ? "bg-[#31D3A9]" : "bg-[#E5E7EB]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {step === 1 && (
                    <>
                      {items.map((item) => (
                        <div key={item.gameId} className="flex gap-3 bg-[#FAFAFA] rounded-xl p-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#F3F4F6] flex items-center justify-center">
                            {item.imagen ? (
                              <ImageWithProgress
                                src={item.imagen}
                                alt={item.nombre}
                                width={64}
                                height={64}
                                className="w-full h-full"
                                imgClassName="object-cover"
                              />
                            ) : (
                              <span className="text-primary font-bold text-lg">
                                {item.nombre.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-[#1F2937] truncate">{item.nombre}</h4>
                              <button onClick={() => removeItem(item.gameId)} aria-label={`Quitar ${item.nombre} del carrito`} className="shrink-0">
                                <Trash2 size={14} className="text-[#9CA3AF] hover:text-red-500 transition-colors" />
                              </button>
                            </div>
                            <p className="text-xs text-[#6B7280] mt-0.5">{formatPrice(item.precioNum)} c/u</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateCantidad(item.gameId, -1)}
                                  aria-label="Disminuir cantidad"
                                  className="w-6 h-6 rounded border border-[#E5E7EB] flex items-center justify-center hover:bg-white transition-colors"
                                >
                                  <Minus size={10} className="text-[#6B7280]" />
                                </button>
                                <span className="text-sm font-semibold text-[#1F2937] w-5 text-center">{item.cantidad}</span>
                                <button
                                  onClick={() => updateCantidad(item.gameId, 1)}
                                  aria-label="Aumentar cantidad"
                                  className="w-6 h-6 rounded border border-[#E5E7EB] flex items-center justify-center hover:bg-white transition-colors"
                                >
                                  <Plus size={10} className="text-[#6B7280]" />
                                </button>
                              </div>
                              <span className="text-sm font-bold text-[#1F2937]">
                                {formatPrice(item.precioNum * item.cantidad)}
                              </span>
                            </div>
                            <textarea
                              value={item.observacion}
                              onChange={(e) => updateObservacion(item.gameId, e.target.value)}
                              placeholder="Observación..."
                              rows={1}
                              maxLength={200}
                              className="mt-2 w-full text-xs rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[#6B7280] resize-none focus:outline-none focus:ring-1 focus:ring-[#31D3A9]/30 transition-all"
                            />
                          </div>
                        </div>
                      ))}

                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Cupón de descuento</label>
                        {coupon ? (
                          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#31D3A9] bg-[#31D3A9]/5 px-4 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <Check size={16} className="text-[#31D3A9] flex-shrink-0" />
                              <span className="text-sm font-semibold text-[#1F2937] truncate">{coupon.codigo}</span>
                              <span className="text-xs text-[#6B7280] flex-shrink-0">
                                {coupon.tipo === "porcentaje" ? `-${coupon.valor}%` : `-${formatPrice(coupon.valor)}`}
                              </span>
                            </div>
                            <button
                              onClick={clearCoupon}
                              aria-label="Quitar cupón"
                              className="text-[#6B7280] hover:text-red-500 transition-colors flex-shrink-0"
                              title="Quitar cupón"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={cupon}
                              onChange={(e) => setCupon(e.target.value)}
                              maxLength={30}
                              className="flex-1 min-w-0 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                              placeholder="Ingresá tu cupón"
                            />
                            <button
                              onClick={handleAplicarCupon}
                              disabled={aplicandoCupon || !cupon.trim()}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1F2937] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#374151] disabled:opacity-50 transition-colors"
                            >
                              {aplicandoCupon ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Tag size={16} />
                              )}
                              Aplicar
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Nombre y apellido *</label>
                        <input
                          type="text"
                          value={nombre}
                          onChange={(e) => handleFieldChange("nombre", e.target.value, setNombre)}
                          maxLength={80}
                          aria-invalid={!!errors.nombre}
                          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 transition-all ${
                            errors.nombre
                              ? "border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-400"
                              : "border-[#E5E7EB] bg-[#FAFAFA] focus:ring-[#31D3A9]/30 focus:border-[#31D3A9]"
                          }`}
                          placeholder="Juan Pérez"
                        />
                        {errors.nombre && (
                          <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Teléfono *</label>
                        <input
                          type="tel"
                          value={telefono}
                          onChange={(e) => handleFieldChange("telefono", e.target.value, setTelefono)}
                          maxLength={20}
                          aria-invalid={!!errors.telefono}
                          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 transition-all ${
                            errors.telefono
                              ? "border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-400"
                              : "border-[#E5E7EB] bg-[#FAFAFA] focus:ring-[#31D3A9]/30 focus:border-[#31D3A9]"
                          }`}
                          placeholder="261 123 4567"
                        />
                        {errors.telefono && (
                          <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Forma de entrega *</label>
                        <div className="space-y-2">
                          {deliveryOptions.map((opt) => (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                                entrega === opt.value
                                  ? "border-[#31D3A9] bg-[#31D3A9]/5"
                                  : errors.entrega
                                    ? "border-red-300 bg-red-50/50 hover:border-red-400"
                                    : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-[#31D3A9]/30"
                              }`}
                            >
                              <input
                                type="radio"
                                name="entrega"
                                value={opt.value}
                                checked={entrega === opt.value}
                                onChange={(e) => {
                                  setEntrega(e.target.value as Entrega);
                                  setErrors((prev) => ({ ...prev, entrega: "" }));
                                }}
                                className="w-4 h-4 text-[#31D3A9] focus:ring-[#31D3A9]/30"
                              />
                              <span className="text-sm text-[#1F2937]">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        {errors.entrega && (
                          <p className="text-xs text-red-500 mt-1">{errors.entrega}</p>
                        )}
                      </div>

                      <AnimatePresence>
                        {entrega === "envio" && (
                          <Motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 rounded-xl border border-[#31D3A9]/20 bg-[#31D3A9]/5 p-3">
                              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2937]">
                                <Truck size={14} className="text-[#31D3A9]" />
                                Zona de envío
                              </p>
                              {zonasActivas.length === 0 ? (
                                <p className="text-xs text-[#6B7280]">
                                  No hay zonas de envío configuradas. Podés retirar tu pedido en Wolfie Room.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {zonasActivas.map((z) => {
                                    const gratisUmbral = z.freeFrom > 0 && total >= z.freeFrom;
                                    const selected = zonaId === z.id;
                                    return (
                                      <label
                                        key={z.id}
                                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                                          selected
                                            ? "border-[#31D3A9] bg-white"
                                            : "border-[#E5E7EB] bg-white hover:border-[#31D3A9]/30"
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name="zona"
                                          value={z.id}
                                          checked={selected}
                                          onChange={() => {
                                            setZonaId(z.id);
                                            setErrors((prev) => ({ ...prev, zona: "" }));
                                          }}
                                          className="mt-0.5 w-4 h-4 text-[#31D3A9] focus:ring-[#31D3A9]/30"
                                        />
                                        <span className="min-w-0">
                                          <span className="block text-sm font-semibold text-[#1F2937]">{z.name}</span>
                                          <span className="block text-xs text-[#6B7280]">
                                            {z.consultar ? (
                                              <span className="font-semibold text-amber-600">
                                                Envío a confirmar por WhatsApp
                                              </span>
                                            ) : gratisUmbral ? (
                                              <span className="font-semibold text-[#31D3A9]">Envío gratis</span>
                                            ) : (
                                              <>
                                                Envío {formatPrice(z.cost)}
                                                {z.freeFrom > 0 && (
                                                  <> · gratis desde {formatPrice(z.freeFrom)}</>
                                                )}
                                              </>
                                            )}
                                          </span>
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                              {errors.zona && (
                                <p className="text-xs text-red-500 mt-1">{errors.zona}</p>
                              )}
                            </div>

                            <div className="mt-3 space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                              <p className="text-xs font-semibold text-[#1F2937]">Dirección de envío</p>
                              <div>
                                <input
                                  type="text"
                                  value={direccion}
                                  onChange={(e) => handleFieldChange("direccion", e.target.value, setDireccion)}
                                  maxLength={120}
                                  aria-invalid={!!errors.direccion}
                                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 transition-all ${
                                    errors.direccion
                                      ? "border-red-400 bg-white focus:ring-red-300 focus:border-red-400"
                                      : "border-[#E5E7EB] bg-white focus:ring-[#31D3A9]/30 focus:border-[#31D3A9]"
                                  }`}
                                  placeholder="Calle y número"
                                />
                                {errors.direccion && (
                                  <p className="text-xs text-red-500 mt-1">{errors.direccion}</p>
                                )}
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={ciudad}
                                  onChange={(e) => handleFieldChange("ciudad", e.target.value, setCiudad)}
                                  maxLength={60}
                                  aria-invalid={!!errors.ciudad}
                                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 transition-all ${
                                    errors.ciudad
                                      ? "border-red-400 bg-white focus:ring-red-300 focus:border-red-400"
                                      : "border-[#E5E7EB] bg-white focus:ring-[#31D3A9]/30 focus:border-[#31D3A9]"
                                  }`}
                                  placeholder="Ciudad / Localidad"
                                />
                                {errors.ciudad && (
                                  <p className="text-xs text-red-500 mt-1">{errors.ciudad}</p>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <input
                                    type="text"
                                    value={provincia}
                                    onChange={(e) => handleFieldChange("provincia", e.target.value, setProvincia)}
                                    maxLength={60}
                                    aria-invalid={!!errors.provincia}
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 transition-all ${
                                      errors.provincia
                                        ? "border-red-400 bg-white focus:ring-red-300 focus:border-red-400"
                                        : "border-[#E5E7EB] bg-white focus:ring-[#31D3A9]/30 focus:border-[#31D3A9]"
                                    }`}
                                    placeholder="Provincia"
                                  />
                                  {errors.provincia && (
                                    <p className="text-xs text-red-500 mt-1">{errors.provincia}</p>
                                  )}
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={codigoPostal}
                                    onChange={(e) => handleFieldChange("codigoPostal", e.target.value, setCodigoPostal)}
                                    maxLength={10}
                                    aria-invalid={!!errors.codigoPostal}
                                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 transition-all ${
                                      errors.codigoPostal
                                        ? "border-red-400 bg-white focus:ring-red-300 focus:border-red-400"
                                        : "border-[#E5E7EB] bg-white focus:ring-[#31D3A9]/30 focus:border-[#31D3A9]"
                                    }`}
                                    placeholder="Código postal"
                                  />
                                  {errors.codigoPostal && (
                                    <p className="text-xs text-red-500 mt-1">{errors.codigoPostal}</p>
                                  )}
                                </div>
                              </div>
                              <input
                                type="text"
                                value={referencia}
                                onChange={(e) => handleFieldChange("referencia", e.target.value, setReferencia)}
                                maxLength={120}
                                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                                placeholder="Referencia (opcional)"
                              />
                            </div>
                          </Motion.div>
                        )}
                      </AnimatePresence>

                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Forma de pago *</label>
                        <div className="space-y-2">
                          {paymentOptions.map((opt) => (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                                pago === opt.value
                                  ? "border-[#31D3A9] bg-[#31D3A9]/5"
                                  : errors.pago
                                    ? "border-red-300 bg-red-50/50 hover:border-red-400"
                                    : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-[#31D3A9]/30"
                              }`}
                            >
                              <input
                                type="radio"
                                name="pago"
                                value={opt.value}
                                checked={pago === opt.value}
                                onChange={(e) => {
                                  setPago(e.target.value);
                                  setErrors((prev) => ({ ...prev, pago: "" }));
                                }}
                                className="w-4 h-4 text-[#31D3A9] focus:ring-[#31D3A9]/30"
                              />
                              <span className="text-sm text-[#1F2937]">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        {errors.pago && (
                          <p className="text-xs text-red-500 mt-1">{errors.pago}</p>
                        )}
                      </div>

                      {paymentMethods.length > 0 && (
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Wallet size={16} className="text-[#31D3A9]" />
                            <p className="text-sm font-semibold text-[#1F2937]">Formas de pago</p>
                          </div>
                          <div className="space-y-2">
                            {paymentMethods.map((pm) => (
                              <div key={pm.id} className="flex items-start gap-2.5">
                                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#31D3A9]/10">
                                  <PaymentMethodIcon icono={pm.icono} size={18} className="text-[#31D3A9]" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-[#1F2937]">{pm.titulo}</p>
                                  {pm.descripcion && (
                                    <p className="text-[11px] leading-snug text-[#6B7280]">{pm.descripcion}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E5E7EB] p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6B7280]">Subtotal</span>
                    <span className="text-sm font-semibold text-[#1F2937]">{formatPrice(total)}</span>
                  </div>
                  {coupon && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6B7280]">
                        Descuento {coupon.codigo}
                      </span>
                      <span className="text-sm font-semibold text-red-500">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {coupon && coupon.minimo > 0 && total < coupon.minimo && (
                    <p className="text-[11px] text-red-500">
                      Este cupón requiere un mínimo de {formatPrice(coupon.minimo)}
                    </p>
                  )}
                  {step === 3 && envio && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6B7280]">Envío</span>
                      <span
                        className={`text-sm font-semibold ${
                          envio.gratis
                            ? "text-[#31D3A9]"
                            : envio.motivo === "consultar"
                              ? "text-amber-600"
                              : "text-[#1F2937]"
                        }`}
                      >
                        {envio.gratis
                          ? "Gratis"
                          : envio.motivo === "consultar"
                            ? "A confirmar"
                            : formatPrice(envio.monto)}
                      </span>
                    </div>
                  )}
                  {step === 3 && envio?.motivo === "consultar" && envio.zona && (
                    <p className="text-[11px] text-amber-600">
                      El costo de envío a {envio.zona.name} se confirma por WhatsApp.
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6B7280]">Total</span>
                    <span className="text-xl font-bold text-[#1F2937]">
                      {formatPrice(step === 3 ? totalConEnvio : finalTotal)}
                    </span>
                  </div>

                  {step === 1 && (
                    <button
                      onClick={() => goToStep(2)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#31D3A9] px-5 py-3 text-sm font-semibold text-[#0B3B30] shadow-lg shadow-[#31D3A9]/20 hover:bg-[#2bc49b] hover:shadow-xl hover:shadow-[#31D3A9]/30 active:scale-[0.98] transition-all"
                    >
                      Hacer pedido
                      <ArrowRight size={16} />
                    </button>
                  )}

                  {step === 2 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => goToStep(1)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1F2937] hover:bg-[#F9FAFB] active:scale-[0.98] transition-all"
                      >
                        <ArrowLeft size={16} />
                        Volver
                      </button>
                      <button
                        onClick={handleContinuar}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#31D3A9] px-5 py-3 text-sm font-semibold text-[#0B3B30] shadow-lg shadow-[#31D3A9]/20 hover:bg-[#2bc49b] hover:shadow-xl hover:shadow-[#31D3A9]/30 active:scale-[0.98] transition-all"
                      >
                        Continuar
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => goToStep(2)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1F2937] hover:bg-[#F9FAFB] active:scale-[0.98] transition-all"
                      >
                        <ArrowLeft size={16} />
                        Volver
                      </button>
                      <button
                        onClick={handleConfirmar}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#31D3A9] px-5 py-3 text-sm font-semibold text-[#0B3B30] shadow-lg shadow-[#31D3A9]/20 hover:bg-[#2bc49b] hover:shadow-xl hover:shadow-[#31D3A9]/30 active:scale-[0.98] transition-all"
                      >
                        <WhatsAppIcon size={16} />
                        Confirmar y pedir por WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
