"use client";

import { MapPin } from "lucide-react";
import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import { trackMarketingEvent } from "@/lib/marketing";

interface HeroProps {
  whatsappNumber: string;
}

export default function Hero({ whatsappNumber }: HeroProps) {
  const { isLite } = useAdaptive();
  const WHATSAPP_RESERVA = `https://wa.me/${whatsappNumber}?text=Hola.%20Quisiera%20consultar%20para%20reservar%20una%20mesa%20en%20Wolfie%20Room.`;

  return (
    <section
      id="inicio"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      {!isLite && (
        <>
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]" />
        </>
      )}

      {!isLite && (
        <>
          <Motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-[15%] h-2 w-2 rounded-full bg-primary/30"
          />
          <Motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-1/3 right-[20%] h-3 w-3 rounded-full bg-secondary/30"
          />
          <Motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/3 left-[25%] h-2 w-2 rounded-full bg-primary/20"
          />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <Motion.div
          initial={{ opacity: 0, y: isLite ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Juegos de mesa en Mendoza
          </div>
        </Motion.div>

        <Motion.h1
          initial={{ opacity: 0, y: isLite ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-4xl font-bold leading-tight tracking-tight text-text sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Descubrí tu próximo{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            juego favorito
          </span>
        </Motion.h1>

        <Motion.p
          initial={{ opacity: 0, y: isLite ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-text-secondary sm:text-xl"
        >
          Jugá en nuestro espacio, reservá una mesa con tus amigos o encontrá
          ese juego que querés llevarte a casa.
        </Motion.p>

        <Motion.div
          initial={{ opacity: 0, y: isLite ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <a
            href={WHATSAPP_RESERVA}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackMarketingEvent({
                event: "ClickWhatsApp",
                data: { source: "hero_reservar_mesa" },
              })
            }
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95"
          >
            Reservar mesa
          </a>
          <a
            href="#catalogo"
            className="group flex items-center gap-2 rounded-full border border-border bg-white px-8 py-3.5 text-base font-semibold text-text shadow-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:scale-105 active:scale-95"
          >
            Ver catálogo
          </a>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-text-secondary"
        >
          <MapPin size={14} className="text-secondary" />
          Patio Lorenza · Mendoza
        </Motion.div>
      </div>
    </section>
  );
}
