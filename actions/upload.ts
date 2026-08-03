"use server";

import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function uploadImage(formData: FormData) {
  await requireAuth();

  const file = formData.get("image") as File | null;
  if (!file) throw new Error("No se proporcionó ningún archivo");

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipo de archivo no permitido");
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("El archivo excede el tamaño máximo de 5MB");
  }

  const ext = file.name.split(".").pop() || "webp";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return { path: `/uploads/${filename}` };
}
