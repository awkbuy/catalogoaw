"use client";

import { motion } from "framer-motion";
import { Gamepad2, CalendarCheck, MapPin, PartyPopper } from "lucide-react";

const steps = [
  {
    icon: Gamepad2,
    title: "Elegí los juegos",
    description: "Explorá nuestro catálogo y encontrá los juegos que te interesan.",
    color: "from-primary/10 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: CalendarCheck,
    title: "Reservá una mesa",
    description: "Escribinos por WhatsApp para confirmar disponibilidad y fechas.",
    color: "from-secondary/10 to-secondary/5",
    iconColor: "text-secondary",
  },
  {
    icon: MapPin,
    title: "Vení a Wolfie Room",
    description: "Pasá a Patio Lorenza, Mendoza, a la hora que acordemos.",
    color: "from-primary/10 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: PartyPopper,
    title: "¡Disfrutá!",
    description: "Pasá una tarde épica con amigos, familia o pareja.",
    color: "from-secondary/10 to-secondary/5",
    iconColor: "text-secondary",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            ¿Cómo funciona?
          </h2>
          <p className="mx-auto max-w-lg text-text-secondary">
            Si querés venir a jugar, es así de simple.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connection line (desktop) */}
          <div className="absolute top-12 right-0 left-0 hidden h-px bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 lg:block" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative text-center"
              >
                {/* Step number & icon */}
                <div className="relative mx-auto mb-6">
                  <div
                    className={`mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color}`}
                  >
                    <Icon size={36} className={step.iconColor} />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-md">
                    {i + 1}
                  </div>
                </div>

                <h3 className="mb-2 text-lg font-bold text-text">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
