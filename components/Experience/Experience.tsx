"use client";

import { motion } from "framer-motion";

const experiences = [
  {
    title: "Más de 20 juegos para descubrir",
    description:
      "Probá títulos nuevos sin tener que comprarlos primero. Desde clásicos hasta novedades.",
    emoji: "🎲",
    gradient: "from-primary/5 to-primary/[0.02]",
    borderColor: "hover:border-primary/20",
  },
  {
    title: "Espacio para jugar",
    description:
      "Reservá una mesa y disfrutá de una tarde con amigos, familia o pareja en Patio Lorenza.",
    emoji: "👥",
    gradient: "from-secondary/5 to-secondary/[0.02]",
    borderColor: "hover:border-secondary/20",
  },
  {
    title: "Llevate tus favoritos",
    description:
      "Si un juego te encanta, consultá por su disponibilidad para compra y armá tu colección.",
    emoji: "🛍",
    gradient: "from-primary/5 to-secondary/[0.02]",
    borderColor: "hover:border-primary/20",
  },
];

export default function Experience() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-white to-background" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Viví la experiencia{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Wolfie Room
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-text-secondary">
            Jugá en nuestro espacio. Descubrí nuevos juegos. Comprá tus
            favoritos. Todo en un solo lugar.
          </p>
        </motion.div>

        {/* Experience cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {experiences.map((exp, i) => {
            return (
              <motion.div
                key={exp.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all ${exp.borderColor} hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1`}
              >
                {/* Gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${exp.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />

                <div className="relative">
                  <div className="mb-5 text-4xl">{exp.emoji}</div>
                  <h3 className="mb-2 text-lg font-bold text-text">
                    {exp.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {exp.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
