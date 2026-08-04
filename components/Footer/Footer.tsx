"use client";

import {
  Camera,
  MapPin,
  Clock,
  Heart,
} from "lucide-react";
import Image from "next/image";
import WhatsAppIcon from "@/components/WhatsAppIcon";

interface FooterProps {
  whatsappNumber: string;
  instagramUrl: string;
  businessName: string;
  direccion: string;
  ciudad: string;
  horarios: string;
  logoUrl?: string | null;
}

export default function Footer({ whatsappNumber, instagramUrl, businessName, direccion, ciudad, horarios, logoUrl }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const WHATSAPP_URL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola. Quisiera consultar para reservar una mesa en ${businessName}.`)}`;

  const footerLinks = [
    {
      label: "WhatsApp",
      href: WHATSAPP_URL,
      icon: WhatsAppIcon,
      external: true,
    },
    {
      label: "Instagram",
      href: instagramUrl,
      icon: Camera,
      external: true,
    },
  ];

  return (
    <footer id="contacto" className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-12 sm:py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src={logoUrl || "/images/logo.png"}
                alt={businessName}
                width={2252}
                height={1373}
                sizes="96px"
                className="h-9 w-auto rounded-xl"
              />
              <span className="text-lg font-bold text-text">
                {businessName}
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
              Jugá, descubrí y llevate tu próximo juego favorito. Tu punto de
              encuentro de juegos de mesa en Mendoza.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text">
              Contacto
            </h3>
            <div className="space-y-3">
              {footerLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 text-sm text-text-secondary transition-colors hover:text-primary"
                  >
                    <Icon size={16} />
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text">
              Ubicación
            </h3>
            <div className="flex items-start gap-3 text-sm text-text-secondary">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <p>
                <span className="font-medium text-text">{direccion}</span>
                <br />
                {ciudad}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text">
              Horarios
            </h3>
            <div className="flex items-start gap-3 text-sm text-text-secondary">
              <Clock size={16} className="mt-0.5 shrink-0" />
              <div>
                {horarios.split("|").map((h, i) => (
                  <p key={i}>{h.trim()}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-border py-6 text-xs text-text-secondary sm:flex-row">
          <p>
            © {currentYear} {businessName}. Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-1">
            Hecho con <Heart size={12} className="text-secondary" /> en
            Mendoza
          </p>
        </div>
      </div>
    </footer>
  );
}
