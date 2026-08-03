import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const setting = await prisma.setting.findUnique({ where: { key: "nombreNegocio" } });
  const nombre = setting?.value || "Wolfie Room";
  return { title: `Admin - ${nombre}` };
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
