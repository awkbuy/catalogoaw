"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AnnouncementBar({ text }: { text: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!text.trim()) return null;

  return (
    <motion.div
      initial={false}
      animate={{
        height: scrolled ? 0 : "auto",
        opacity: scrolled ? 0 : 1,
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed top-16 left-0 right-0 z-40 overflow-hidden bg-gradient-to-r from-[#0B3B30] to-[#31D3A9]"
      data-testid="announcement-bar"
    >
      <div className="px-4 py-2 text-center text-sm font-semibold text-white">
        {text}
      </div>
    </motion.div>
  );
}
