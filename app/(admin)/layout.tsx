import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/admin/AdminSidebar";

export async function generateMetadata(): Promise<Metadata> {
  const setting = await prisma.setting.findUnique({ where: { key: "nombreNegocio" } });
  const nombre = setting?.value || "Wolfie Room";
  return { title: `Admin - ${nombre}` };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  const settingsRows = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settingsRows) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AdminSidebar settings={settingsMap}>
        {children}
      </AdminSidebar>
    </div>
  );
}
