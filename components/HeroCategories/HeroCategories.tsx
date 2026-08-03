"use client";

import { useRef } from "react";
import Image from "next/image";
import { Dices } from "lucide-react";
import { motion, useInView, type Variants } from "framer-motion";

interface Category {
  id: string;
  nombre: string;
  icono: string | null;
  color: string;
  tags: string;
  _count: { games: number };
}

interface HeroCategoriesProps {
  categories: Category[];
  logoUrl?: string | null;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function HeroCategories({ categories, logoUrl }: HeroCategoriesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  if (categories.length === 0) return null;

  const handleCategoryClick = (nombre: string) => {
    const catalogSection = document.getElementById("catalogo");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth" });
      const url = new URL(window.location.href);
      url.searchParams.set("categoria", nombre);
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new CustomEvent("categoryChange", { detail: nombre }));
    }
  };

  const handleAllCategories = () => {
    const catalogSection = document.getElementById("catalogo");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth" });
      const url = new URL(window.location.href);
      url.searchParams.delete("categoria");
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new CustomEvent("categoryChange", { detail: "Todos" }));
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-28 bg-[#FAFAFA]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Wolfie Room"
              width={2252}
              height={1373}
              className="mb-4 inline-block h-12 w-auto object-contain"
            />
          ) : (
            <Dices className="mb-4 inline-block h-12 w-12 text-[#31D3A9]" />
          )}
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
            Explorá por categoría
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[#6B7280]">
              Encontrá el juego perfecto para cada ocasión
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
        >
          {categories.map((cat) => {
            const hasImage = cat.icono && (cat.icono.startsWith("/") || cat.icono.startsWith("http"));
            const promo = cat.tags
              ? cat.tags.split(",").map((t) => t.trim()).filter(Boolean)[0]
              : "";
            const { r, g, b } = hexToRgb(cat.color);

            return (
              <motion.button
                key={cat.id}
                variants={cardVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={() => handleCategoryClick(cat.nombre)}
                className="group relative h-[200px] sm:h-[220px] overflow-hidden rounded-[20px] shadow-sm transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/60 hover:shadow-2xl hover:shadow-black/20"
              >
                {hasImage ? (
                  <Image
                    src={cat.icono!}
                    alt={cat.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, rgba(${r},${g},${b},0.85) 0%, rgba(${Math.max(r - 60, 0)},${Math.max(g - 60, 0)},${Math.max(b - 60, 0)},0.95) 100%)`,
                    }}
                  >
                    <span className="text-6xl opacity-90 drop-shadow-lg">
                      {cat.icono || "🎲"}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10 transition-opacity duration-300" />

                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">
                    {cat.nombre}
                  </h3>
                  <p className="mt-1 text-sm text-white/80 drop-shadow">
                    {cat._count.games} juego{cat._count.games !== 1 ? "s" : ""}
                  </p>
                </div>

                {promo && (
                  <span className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-white/85 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-[#FF7BAC] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                    {promo}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 text-center"
        >
          <button
            onClick={handleAllCategories}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-medium text-[#6B7280] shadow-sm transition-all hover:border-[#31D3A9]/30 hover:text-[#1F2937] hover:shadow-md active:scale-95"
          >
            Todas las categorías
          </button>
        </motion.div>
      </div>
    </section>
  );
}
