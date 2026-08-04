"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Home, Info } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import AppleDock from "@/components/AppleDock";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import InfoModal from "@/components/InfoModal";
import {
  obtenerEstadoHorario,
  type DiaHorario,
} from "@/lib/horarios";

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Catálogo", href: "#catalogo" },
];

const sections = ["inicio", "catalogo"];

interface NavbarProps {
  whatsappNumber: string;
  businessName: string;
  logoUrl?: string | null;
  horarios: DiaHorario[];
  onCartClick?: () => void;
  onCartClose?: () => void;
}

export default function Navbar({ whatsappNumber, businessName, logoUrl, horarios, onCartClick, onCartClose }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [infoOpen, setInfoOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const estadoHorario = obtenerEstadoHorario(horarios, now);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const WHATSAPP_URL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola. Quisiera consultar para reservar una mesa en ${businessName}.`)}`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sectionEls = sections
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
    }
  };

  const bottomTabs = [
    {
      id: "inicio",
      label: "Inicio",
      icon: <Home size={20} className="text-current" />,
      onClick: () => {
        onCartClose?.();
        scrollTo("inicio");
      },
    },
    {
      id: "info",
      label: "Información",
      icon: <Info size={20} className="text-current" />,
      onClick: () => {
        onCartClose?.();
        setInfoOpen(true);
      },
    },
    {
      id: "carrito",
      label: "Carrito",
      icon: <ShoppingCart size={20} className="text-current" />,
      onClick: onCartClick,
      badge: 0,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: <WhatsAppIcon size={20} className="text-current" />,
      onClick: () => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer"),
    },
  ];

  const { itemCount } = useCart();
  const tabsWithBadge = bottomTabs.map((tab) =>
    tab.id === "carrito" ? { ...tab, badge: itemCount } : tab
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.a
              href="/"
              aria-label={businessName}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center"
            >
              <Image
                src={logoUrl || "/images/logo.png"}
                alt={businessName}
                width={2252}
                height={1373}
                sizes="96px"
                loading="eager"
                className="h-9 w-auto md:h-11"
              />
            </motion.a>

            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100 hover:text-text"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => setInfoOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100 hover:text-text"
              >
                <Info size={16} />
                Información
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    estadoHorario.estado === "cerrado"
                      ? "bg-red-500"
                      : estadoHorario.estado === "por_cerrar"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                />
              </button>
              <button
                onClick={onCartClick}
                aria-label="Abrir carrito"
                className="relative ml-1 flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-white text-text-secondary hover:border-primary/30 hover:text-text transition-all"
              >
                <ShoppingCart size={18} />
                <CartBadge />
              </button>
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setInfoOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-white text-text-secondary hover:border-primary/30 hover:text-text transition-all"
                aria-label="Información"
              >
                <Info size={18} />
              </button>
              <button
                onClick={onCartClick}
                aria-label="Abrir carrito"
                className="relative ml-2 flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-white text-text-secondary hover:border-primary/30 hover:text-text transition-all"
              >
                <ShoppingCart size={18} />
                <CartBadge />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AppleDock tabs={tabsWithBadge} activeTab={activeSection} />

      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        horarios={horarios}
        whatsappNumber={whatsappNumber}
        businessName={businessName}
      />
    </>
  );
}

function CartBadge() {
  const { itemCount } = useCart();
  if (itemCount === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-secondary text-white text-[9px] font-bold leading-none">
      {itemCount > 9 ? "9+" : itemCount}
    </span>
  );
}
