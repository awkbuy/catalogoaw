import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await requireTenantId();

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // La validación real del contenido la hace sharp: si no es una imagen
  // decodificable (archivo corrupto, ejecutable disfrazado, texto, etc.)
  // sharp lanza un error y lo rechazamos con 400. NO hay que buscar bytes
  // nulos a mano: casi toda imagen real (JPG/PNG/WebP/GIF) contiene ceros
  // en sus cabeceras y datos, así que ese check rechazaba imágenes válidas.
  let processed: Buffer;
  try {
    processed = await sharp(buffer).webp({ quality: 85 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  const filename = `${crypto.randomUUID()}.webp`;
  const uploadDir = join(process.cwd(), "public", "uploads", tenantId);

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), processed);
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ url: `/uploads/${tenantId}/${filename}` });
}
