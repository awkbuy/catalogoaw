"use server";

import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

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

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.includes(0)) {
    throw new Error("Contenido de archivo inválido");
  }

  const filename = `${crypto.randomUUID()}.webp`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  let processed: Buffer;
  try {
    processed = await sharp(buffer).webp({ quality: 85 }).toBuffer();
  } catch {
    throw new Error("Contenido de archivo inválido");
  }

  await writeFile(path.join(uploadsDir, filename), processed);

  return { path: `/uploads/${filename}` };
}
