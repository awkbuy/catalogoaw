"use client";

import { motion } from "framer-motion";
import {
  Users,
  Activity,
  Eye,
  Package,
  ShoppingCart,
  MessageCircle,
  Search,
  CreditCard,
} from "lucide-react";
import type { MarketingTotals } from "@/lib/marketing/dashboard";

const iconMap = {
  uniqueVisitors: Users,
  sessions: Activity,
  pageViews: Eye,
  productViews: Package,
  cartAdditions: ShoppingCart,
  whatsappClicks: MessageCircle,
  searches: Search,
  checkouts: CreditCard,
};

const LABELS: Record<keyof MarketingTotals, string> = {
  uniqueVisitors: "Visitas únicas",
  sessions: "Sesiones",
  pageViews: "Vistas de página",
  productViews: "Vistas de producto",
  cartAdditions: "Agregados al carrito",
  whatsappClicks: "Clics en WhatsApp",
  searches: "Búsquedas",
  checkouts: "Checkouts",
};

export default function MarketingKPICards({ totals }: { totals: MarketingTotals }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {(Object.keys(LABELS) as (keyof MarketingTotals)[]).map((key, i) => {
        const Icon = iconMap[key];
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            data-testid={`kpi-${key}`}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#31D3A9]/10 text-[#31D3A9] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1F2937]">{totals[key]}</p>
            <p className="text-[#6B7280] text-sm mt-0.5">{LABELS[key]}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
