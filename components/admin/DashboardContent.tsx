"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  FolderOpen,
  Star,
  Package,
  Clock,
} from "lucide-react";

const iconMap: Record<string, typeof Gamepad2> = {
  Gamepad2,
  FolderOpen,
  Star,
  Package,
};

interface Stat {
  label: string;
  value: number;
  icon: string;
  gradient: string;
  iconColor: string;
}

interface DashboardContentProps {
  stats: Stat[];
  lastUpdated: string;
}

export default function DashboardContent({ stats, lastUpdated }: DashboardContentProps) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F2937]">Dashboard</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Resumen general del catálogo
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = iconMap[stat.icon];
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl border border-[#E5E7EB] p-5`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${stat.iconColor} shadow-sm`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1F2937]">{stat.value}</p>
              <p className="text-[#6B7280] text-sm mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.25 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1F2937]">
              Última actualización
            </p>
            <p className="text-[#6B7280] text-sm">{lastUpdated}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
