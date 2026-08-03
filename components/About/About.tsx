"use client";

import { motion } from "framer-motion";
import { Dice5, ShoppingBag, CalendarDays } from "lucide-react";

interface AboutProps {
  whatsappNumber: string;
}

export default function About({ whatsappNumber }: AboutProps) {
  const WHATSAPP_RESERVA = `https://wa.me/${whatsappNumber}?text=Hola.%20Quisiera%20consultar%20para%20reservar%20una%20mesa%20en%20Wolfie%20Room.`;

  const actions = [
    {
      icon: Dice5,
      title: "Jugá",
      description:
        "Reservá una mesa y disfrutá de nuestra ludoteca con amigos o familia.",
      gradient: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: ShoppingBag,
      title: "Comprá",
      description:
        "Encontrá una selección de juegos de mesa para llevar a casa.",
      gradient: "from-secondary/10 to-secondary/5",
      iconColor: "text-secondary",
    },
    {
      icon: CalendarDays,
      title: "Reservá",
      description:
        "Escribinos por WhatsApp para reservar tu lugar y consultar disponibilidad.",
      gradient: "from-primary/10 to-secondary/5",
      iconColor: "text-primary",
      link: WHATSAPP_RESERVA,
    },
  ];

  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            ¿Qué podés hacer en Wolfie Room?
          </h2>
          <p className="mx-auto max-w-lg text-text-secondary">
            Más que una tienda, somos un punto de encuentro para los amantes de
            los juegos de mesa.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, i) => {
            const Icon = action.icon;
            const Wrapper = action.link ? "a" : "div";
            const wrapperProps = action.link
              ? {
                  href: action.link,
                  target: "_blank",
                  rel: "noopener noreferrer",
                }
              : {};

            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Wrapper
                  {...wrapperProps}
                  className="group flex h-full flex-col items-center rounded-2xl border border-border bg-card p-8 text-center transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1"
                >
                  <div
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${action.gradient}`}
                  >
                    <Icon size={30} className={action.iconColor} />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-text">
                    {action.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {action.description}
                  </p>
                </Wrapper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
