import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const setting = await prisma.setting.findUnique({ where: { key: "nombreNegocio" } });
  const nombre = setting?.value || "Catalogo App";
  return {
    title: `Admin - ${nombre}`,
    robots: { index: false, follow: false },
  };
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
