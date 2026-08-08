"use client";

import { Motion } from "@/components/motion-wrapper";
import { useAdaptive } from "@/lib/adaptive-context";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface LandingHeroProps {
  title: string;
  description: string;
  image?: string;
  bannerColor: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export default function LandingHero({
  title,
  description,
  image,
  bannerColor,
  fallbackTitle,
  fallbackDescription,
}: LandingHeroProps) {
  const { isLite } = useAdaptive();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const heroTitle = title || fallbackTitle || "Wolfie Room";
  const heroDescription =
    description ||
    fallbackDescription ||
    "Descubrí nuestras mejores ofertas en juegos de mesa.";

  const scrollToGrid = () => {
    const grid = document.getElementById("catalogo");
    if (grid) grid.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative overflow-hidden"
      style={{ backgroundColor: bannerColor }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,${
            image ? 0.45 : 0
          }), rgba(0,0,0,${image ? 0.55 : 0}))`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center">
        <Motion.div
          initial={isLite ? {} : { opacity: 0, y: 24 }}
          animate={isInView || isLite ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl"
        >
          {heroTitle && (
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
              {heroTitle}
            </h1>
          )}
          {heroDescription && (
            <p className="mt-4 text-lg sm:text-xl text-white/90 drop-shadow-md">
              {heroDescription}
            </p>
          )}
          <button
            onClick={scrollToGrid}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0B3B30] shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Ver juegos
            <ArrowDown className="w-4 h-4" />
          </button>
        </Motion.div>
      </div>
    </section>
  );
}
