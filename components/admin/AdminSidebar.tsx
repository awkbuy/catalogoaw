"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { logoutAction } from "@/actions/auth";
import {
  LayoutDashboard,
  Gamepad2,
  FolderOpen,
  Ticket,
  Clock,
  Wallet,
  Settings,
  Search,
  LogOut,
  ChevronLeft,
  User,
  Rocket,
  Megaphone,
} from "lucide-react";
import Image from "next/image";
import AppleDock from "@/components/AppleDock";

interface Settings {
  logoUrl?: string | null;
  nombre?: string | null;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/games", label: "Juegos", icon: Gamepad2 },
  { href: "/categories", label: "Categorías", icon: FolderOpen },
  { href: "/landings", label: "Landings", icon: Rocket },
  { href: "/cupones", label: "Cupones", icon: Ticket },
  { href: "/pagos", label: "Medios de Pago", icon: Wallet },
  { href: "/horarios", label: "Horarios", icon: Clock },
  { href: "/seo", label: "SEO", icon: Search },
  { href: "/settings", label: "Configuración", icon: Settings },
];

const bottomTabs = navLinks.map((link) => ({
  id: link.href,
  label: link.label,
  icon: <link.icon size={20} className="text-current" />,
}));

interface SidebarContentProps {
  collapsed: boolean;
  pathname: string;
  settings?: Settings | null;
  onToggleCollapse: () => void;
}

function SidebarContent({
  collapsed,
  pathname,
  settings,
  onToggleCollapse,
}: SidebarContentProps) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src={settings?.logoUrl || "/images/logo.png"}
            alt={settings?.nombre || "Wolfie Room"}
            width={2252}
            height={1373}
            sizes="96px"
            className="h-9 w-auto rounded-xl flex-shrink-0"
          />
          {!collapsed && (
            <span className="font-bold text-[#1F2937] text-lg whitespace-nowrap">
              {settings?.nombre || "Wolfie Room"}
            </span>
          )}
        </Link>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#E5E7EB] transition-colors"
        >
          <ChevronLeft
            className={`w-4 h-4 text-[#6B7280] transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#31D3A9]/10 text-[#31D3A9]"
                  : "text-[#6B7280] hover:bg-[#E5E7EB]/50 hover:text-[#1F2937]"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#E5E7EB]">
        <Link
          href="/account"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#E5E7EB]/50 hover:text-[#1F2937] transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Mi Cuenta</span>}
        </Link>
        <button
          onClick={async () => { await logoutAction(); }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-all w-full ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = navLinks.find(
    (l) => pathname === l.href || pathname.startsWith(l.href + "/")
  )?.href || "/dashboard";

  const tabsWithAction = bottomTabs.map((tab) => ({
    ...tab,
    onClick: () => router.push(tab.id),
  }));

  return <AppleDock tabs={tabsWithAction} activeTab={activeTab} hideOn="lg:hidden" />;
}

export default function AdminSidebar({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings?: Settings | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const handleToggleCollapse = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <div className="flex min-h-screen">
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-300 sticky top-0 h-screen ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          pathname={pathname}
          settings={settings}
          onToggleCollapse={handleToggleCollapse}
        />
      </aside>

      <div className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-3">
          <Image
            src={settings?.logoUrl || "/images/logo.png"}
            alt={settings?.nombre || "Wolfie Room"}
            width={2252}
            height={1373}
            sizes="64px"
            className="h-8 w-auto rounded-lg"
          />
          <span className="font-bold text-[#1F2937]">
            {settings?.nombre || "Wolfie Room"}
          </span>
          <div className="ml-auto">
            <button
              onClick={async () => { await logoutAction(); }}
              className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8"
        >
          {children}
        </motion.main>
      </div>

      <BottomNav />
    </div>
  );
}
