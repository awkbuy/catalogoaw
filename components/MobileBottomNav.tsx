"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  badge?: number;
}

interface MobileBottomNavProps {
  tabs: Tab[];
  activeTab: string;
}

export default function MobileBottomNav({ tabs, activeTab }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2 min-w-0"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#31D3A9]"
                />
              )}
              <div className="relative">
                {tab.icon}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-[#FF7BAC] px-1 text-[9px] font-bold text-white leading-none">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight transition-colors ${
                  isActive ? "text-[#1F2937]" : "text-[#9CA3AF]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
