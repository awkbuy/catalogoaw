const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  "No file": "No se recibió ningún archivo.",
  "File too large": "El archivo supera el límite de 10 MB.",
  "Invalid file type": "Solo se permiten imágenes JPG, PNG, WebP o GIF.",
  "Invalid image": "El archivo no es una imagen válida.",
  "Invalid file content": "El archivo no es una imagen válida.",
  "Save failed":
    "No se pudo guardar la imagen en el servidor. Reintentá en un momento.",
  Unauthorized: "Tu sesión expiró. Volvé a iniciar sesión e intentá de nuevo.",
};

export function uploadErrorMessage(code?: string): string {
  return (
    (code && UPLOAD_ERROR_MESSAGES[code]) ||
    "No se pudo subir la imagen. Reintentá en un momento."
  );
}

export type UploadImageResult = { url: string } | { error: string };

export async function uploadImage(file: File): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
  } catch {
    return { error: "Error de conexión. Revisá tu internet e intentá de nuevo." };
  }

  let code: string | undefined;
  try {
    const data = await res.json();
    if (res.ok && typeof data?.url === "string") {
      return { url: data.url };
    }
    code = typeof data?.error === "string" ? data.error : undefined;
  } catch {
    // Respuesta sin JSON: dejamos el mensaje genérico.
  }

  if (res.status === 401) code = "Unauthorized";
  return { error: uploadErrorMessage(code) };
}
