"use server";

import { requireAuth } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getGames(filters?: {
  categoriaId?: string;
  search?: string;
  destacado?: boolean;
  nuevo?: boolean;
  estado?: string;
}) {
  const prisma = await getTenantDb();
  const where: Record<string, unknown> = {};

  if (filters?.categoriaId) where.categoriaId = filters.categoriaId;
  if (filters?.destacado !== undefined) where.destacado = filters.destacado;
  if (filters?.nuevo !== undefined) where.nuevo = filters.nuevo;
  if (filters?.estado) where.estado = filters.estado;
  if (filters?.search) {
    where.OR = [
      { nombre: { contains: filters.search } },
      { descripcion: { contains: filters.search } },
    ];
  }

  return prisma.game.findMany({
    where,
    include: { categoria: true },
    orderBy: { orden: "asc" },
  });
}

export async function getGameBySlug(slug: string) {
  const prisma = await getTenantDb();
  return prisma.game.findUnique({
    where: { slug },
    include: { categoria: true },
  });
}

export async function createGame(formData: FormData) {
  await requireAuth();
  const prisma = await getTenantDb();

  const nombre = formData.get("nombre") as string;
  const slug = slugify(nombre);

  const existingGame = await prisma.game.findUnique({ where: { slug } });
  if (existingGame) {
    throw new Error("Ya existe un juego con ese nombre");
  }

  const data = {
    nombre,
    slug,
    descripcion: (formData.get("descripcion") as string) || "",
    categoriaId: formData.get("categoriaId") as string,
    jugadoresMin: Number(formData.get("jugadoresMin")) || 2,
    jugadoresMax: Number(formData.get("jugadoresMax")) || 6,
    duracion: (formData.get("duracion") as string) || "60 min",
    edad: (formData.get("edad") as string) || "8+",
    dificultad: (formData.get("dificultad") as string) || "Normal",
      precioFinalVenta: (formData.get("precioFinalVenta") as string) || "",
    imagen: (formData.get("imagen") as string) || "",
    estado: (formData.get("estado") as string) || "Disponible",
    destacado: formData.get("destacado") === "on",
    nuevo: formData.get("nuevo") === "on",
    disponibleVenta: formData.get("disponibleVenta") === "on",
    disponibleMesa: formData.get("disponibleMesa") !== "off",
    orden: Number(formData.get("orden")) || 0,
  };

  const maxOrder = await prisma.game.aggregate({ _max: { orden: true } });
  data.orden = data.orden || (maxOrder._max.orden ?? 0) + 1;

  return prisma.game.create({ data });
}

export async function updateGame(id: string, formData: FormData) {
  await requireAuth();
  const prisma = await getTenantDb();

  const nombre = formData.get("nombre") as string;
  const newSlug = slugify(nombre);

  const existingGame = await prisma.game.findFirst({
    where: { slug: newSlug, NOT: { id } },
  });
  if (existingGame) {
    throw new Error("Ya existe otro juego con ese nombre");
  }

  return prisma.game.update({
    where: { id },
    data: {
      nombre,
      slug: newSlug,
      descripcion: (formData.get("descripcion") as string) || "",
      categoriaId: formData.get("categoriaId") as string,
      jugadoresMin: Number(formData.get("jugadoresMin")) || 2,
      jugadoresMax: Number(formData.get("jugadoresMax")) || 6,
      duracion: (formData.get("duracion") as string) || "60 min",
      edad: (formData.get("edad") as string) || "8+",
      dificultad: (formData.get("dificultad") as string) || "Normal",
    precioFinalVenta: (formData.get("precioFinalVenta") as string) || "",
      imagen:
        (formData.get("imagen") as string) || "",
      estado: (formData.get("estado") as string) || "Disponible",
      destacado: formData.get("destacado") === "on",
      nuevo: formData.get("nuevo") === "on",
      disponibleVenta: formData.get("disponibleVenta") === "on",
      disponibleMesa: formData.get("disponibleMesa") !== "off",
      orden: Number(formData.get("orden")) || 0,
    },
  });
}

export async function deleteGame(id: string) {
  await requireAuth();
  const prisma = await getTenantDb();
  return prisma.game.delete({ where: { id } });
}

export async function duplicateGame(id: string) {
  await requireAuth();
  const prisma = await getTenantDb();

  const original = await prisma.game.findUnique({ where: { id } });
  if (!original) throw new Error("Juego no encontrado");

  const copyNumber = await prisma.game.count({
    where: { nombre: { contains: `${original.nombre} (copia` } },
  });

  const newNombre = `${original.nombre} (copia${copyNumber > 0 ? ` ${copyNumber + 1}` : ""})`;

  const maxOrder = await prisma.game.aggregate({ _max: { orden: true } });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt, updatedAt, ...rest } = original;

  return prisma.game.create({
    data: {
      ...rest,
      nombre: newNombre,
      slug: slugify(newNombre),
      orden: (maxOrder._max.orden ?? 0) + 1,
    },
  });
}
