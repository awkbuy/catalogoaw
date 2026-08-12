"use server";

import { requireAuth } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function uploadImage(formData: FormData) {
  await requireAuth();
  const tenantId = await requireTenantId();

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
  // Uploads por tenant: public/uploads/<tenantId>/
  const uploadsDir = path.join(process.cwd(), "public", "uploads", tenantId || "default");
  await mkdir(uploadsDir, { recursive: true });

  let processed: Buffer;
  try {
    const sharp = (await import("sharp")).default;
    processed = await sharp(buffer).webp({ quality: 85 }).toBuffer();
  } catch {
    throw new Error("Contenido de archivo inválido");
  }

  await writeFile(path.join(uploadsDir, filename), processed);

  return { path: `/uploads/${tenantId || "default"}/${filename}` };
}
