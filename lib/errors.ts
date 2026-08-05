export function isPrismaNotFound(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  if (code === "P2025") return true;
  if (error instanceof Error) {
    return (
      error.message.includes("Record to update not found") ||
      error.message.includes("Record to delete not found")
    );
  }
  return false;
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Unique constraint")) {
      return "Ya existe un registro con esos datos";
    }
    if (error.message.includes("Foreign key constraint")) {
      return "No se puede eliminar este registro porque está referenciado por otros datos";
    }
    if (isPrismaNotFound(error)) {
      return "El registro no fue encontrado";
    }
  }
  return "Error interno del servidor";
}

export async function parseJsonBody(
  req: Request
): Promise<Record<string, unknown> | null> {
  try {
    const data = await req.json();
    if (data === null || data === undefined) return null;
    if (Array.isArray(data) || typeof data !== "object") return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}