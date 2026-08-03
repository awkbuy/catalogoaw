"use client";

import Image from "next/image";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { InView } from "@/components/motion-primitives/in-view";

interface Category {
  id: string;
  nombre: string;
  icono: string | null;
  color: string;
  _count: { games: number };
}

interface CategoriesSectionProps {
  categories: Category[];
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
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

  if (categories.length === 0) return null;

  return (
    <section className="py-20 sm:py-28 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <InView
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6 }}
            viewOptions={{ once: true }}
          >
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Categorías
            </h2>
            <p className="mx-auto max-w-lg text-text-secondary">
              Encontrá juegos por categoría y descubrí nuevos favoritos
            </p>
          </InView>
        </div>

        <AnimatedGroup
          preset="blur-slide"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.nombre)}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white border border-border p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 w-full"
              style={{ borderColor: cat.color + "30" }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: cat.color + "20" }}
              >
                {cat.icono && (cat.icono.startsWith("/") || cat.icono.startsWith("http")) ? (
                    <Image src={cat.icono} alt="" width={28} height={28} className="object-contain" />
                  ) : (
                    cat.icono || "📁"
                  )}
              </div>
              <span className="text-sm font-semibold text-text text-center">
                {cat.nombre}
              </span>
              <span className="text-xs text-text-secondary">
                {cat._count.games} juego{cat._count.games !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </AnimatedGroup>
      </div>
    </section>
  );
}
