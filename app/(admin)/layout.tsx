import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminPath } from "@/lib/admin-path";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminPathProvider } from "@/components/admin/AdminPathProvider";

export async function generateMetadata(): Promise<Metadata> {
  const setting = await prisma.setting.findUnique({ where: { key: "nombreNegocio" } });
  const nombre = setting?.value || "Wolfie Room";
  return {
    title: `Admin - ${nombre}`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, tenantId } = await requireAuth();

  const settingsRows = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settingsRows) {
    settingsMap[s.key] = s.value;
  }

  return (
    <AdminPathProvider adminPath={getAdminPath()}>
      <div className="min-h-screen bg-[#FAFAFA]">
        <AdminSidebar settings={settingsMap}>
          {children}
        </AdminSidebar>
      </div>
    </AdminPathProvider>
  );
}
