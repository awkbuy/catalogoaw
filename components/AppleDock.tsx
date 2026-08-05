"use client";

import {
  Dock,
  DockIcon,
  DockItem,
  DockLabel,
} from "@/components/motion-primitives/dock";
import { motion } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAdaptive } from "@/lib/adaptive-context";

export type DockTab = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  badge?: number;
};

interface AppleDockProps {
  tabs: DockTab[];
  activeTab: string;
  hideOn?: string;
  forceVisible?: boolean;
}

export default function AppleDock({ tabs, activeTab, hideOn = "md:hidden", forceVisible }: AppleDockProps) {
  const { isLite } = useAdaptive();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const prevY = lastScrollY.current;

      if (currentY > prevY + 6) {
        setHidden(true);
      } else if (currentY < prevY) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHidden = hidden && !forceVisible;

  // Lite: dock estático, sin springs ni magnification
  if (isLite) {
    return (
      <div
        className={cn("fixed left-0 right-0 flex justify-center", hideOn, forceVisible ? "z-[60]" : "z-50")}
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div
          role="toolbar"
          aria-label="Application dock"
          className="flex items-center gap-1 rounded-2xl border border-[#E5E7EB] bg-white/95 px-3 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={tab.onClick}
                aria-label={tab.label}
                title={tab.label}
                className={cn(
                  "relative flex items-center justify-center rounded-xl p-3",
                  isActive ? "text-[#31D3A9]" : "text-[#9CA3AF]"
                )}
              >
                <div className="relative flex items-center justify-center">
                  {tab.icon}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-[#FF7BAC] px-1 text-[9px] font-bold text-white leading-none">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{ y: isHidden ? 160 : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={cn("fixed left-0 right-0 flex justify-center", hideOn, forceVisible ? "z-[60]" : "z-50")}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <Dock magnification={80} distance={150} className="border border-[#E5E7EB] bg-white/80 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <DockItem
              key={tab.id}
              onClick={tab.onClick}
              label={tab.label}
              className={isActive ? "text-[#31D3A9]" : "text-[#9CA3AF]"}
            >
              <DockIcon>
                <div className="relative flex items-center justify-center">
                  {tab.icon}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-[#FF7BAC] px-1 text-[9px] font-bold text-white leading-none">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  ) : null}
                </div>
              </DockIcon>
              <DockLabel>{tab.label}</DockLabel>
            </DockItem>
          );
        })}
      </Dock>
    </motion.div>
  );
}
