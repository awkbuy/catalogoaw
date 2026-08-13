"use server";

import { requireAuth } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";

export async function getCategories() {
  const prisma = await getTenantDb();
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { orden: "asc" },
  });
}

export async function createCategory(formData: FormData) {
  await requireAuth();
  const prisma = await getTenantDb();

  const nombre = formData.get("nombre") as string;
  if (!nombre) throw new Error("El nombre es requerido");

  const existing = await prisma.category.findUnique({ where: { nombre } });
  if (existing) throw new Error("Ya existe una categoría con ese nombre");

  const maxOrder = await prisma.category.aggregate({ _max: { orden: true } });

  return prisma.category.create({
    data: {
      nombre,
      icono: (formData.get("icono") as string) || "🎲",
      color: (formData.get("color") as string) || "#31D3A9",
      orden: (maxOrder._max.orden ?? 0) + 1,
    },
  });
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAuth();
  const prisma = await getTenantDb();

  const nombre = formData.get("nombre") as string;
  if (!nombre) throw new Error("El nombre es requerido");

  const existing = await prisma.category.findFirst({
    where: { nombre, NOT: { id } },
  });
  if (existing) throw new Error("Ya existe otra categoría con ese nombre");

  return prisma.category.update({
    where: { id },
    data: {
      nombre,
      icono: (formData.get("icono") as string) || "🎲",
      color: (formData.get("color") as string) || "#31D3A9",
      orden: Number(formData.get("orden")) || 0,
    },
  });
}

export async function deleteCategory(id: string) {
  await requireAuth();
  const prisma = await getTenantDb();

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) throw new Error("Categoría no encontrada");
  if (category._count.products > 0) {
    throw new Error(
      "No se puede eliminar una categoría que tiene productos asociados"
    );
  }

  return prisma.category.delete({ where: { id } });
}
