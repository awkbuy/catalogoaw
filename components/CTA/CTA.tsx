"use client";

import { motion } from "framer-motion";
import WhatsAppIcon from "@/components/WhatsAppIcon";

interface CTAProps {
  whatsappNumber: string;
}

export default function CTA({ whatsappNumber }: CTAProps) {
  const WHATSAPP_RESERVA = `https://wa.me/${whatsappNumber}?text=Hola.%20Quisiera%20hacer%20una%20consulta.`;

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-8 text-center sm:p-12"
        >
          <div className="absolute top-4 left-4 h-2 w-2 rounded-full bg-white/20" />
          <div className="absolute top-8 right-8 h-3 w-3 rounded-full bg-white/15" />
          <div className="absolute bottom-6 left-12 h-2 w-2 rounded-full bg-white/20" />
          <div className="absolute right-12 bottom-4 h-4 w-4 rounded-full bg-white/10" />

          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            ¿Te ayudamos a encontrar lo que buscás?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-base text-white/80 sm:text-lg">
            Consultanos por cualquiera de nuestros productos y te asesoramos.
          </p>
          <a
            href={WHATSAPP_RESERVA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-primary shadow-xl transition-all hover:bg-white/90 hover:scale-105 active:scale-95"
          >
            <WhatsAppIcon size={18} />
            Consultar por WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
}
