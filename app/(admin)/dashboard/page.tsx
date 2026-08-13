import { prisma } from "@/lib/prisma";
import DashboardContent from "@/components/admin/DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    totalProductos,
    totalCategorias,
    productosDestacados,
    productosPublicados,
    lastSetting,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.count({ where: { destacado: true } }),
    prisma.product.count({ where: { estado: "Disponible" } }),
    prisma.setting.findFirst({ orderBy: { updatedAt: "desc" } }),
  ]);

  const stats = [
    {
      label: "Total Productos",
      value: totalProductos,
      icon: "Package",
      gradient: "from-[#31D3A9]/10 to-[#31D3A9]/5",
      iconColor: "text-[#31D3A9]",
    },
    {
      label: "Categorías",
      value: totalCategorias,
      icon: "FolderOpen",
      gradient: "from-[#FF7BAC]/10 to-[#FF7BAC]/5",
      iconColor: "text-[#FF7BAC]",
    },
    {
      label: "Destacados",
      value: productosDestacados,
      icon: "Star",
      gradient: "from-yellow-400/10 to-yellow-400/5",
      iconColor: "text-yellow-500",
    },
    {
      label: "Publicados",
      value: productosPublicados,
      icon: "Package",
      gradient: "from-blue-400/10 to-blue-400/5",
      iconColor: "text-blue-500",
    },
  ];

  const lastUpdated = lastSetting?.updatedAt
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(lastSetting.updatedAt)
    : "N/A";

  return <DashboardContent stats={stats} lastUpdated={lastUpdated} />;
}
