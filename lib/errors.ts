export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Unique constraint")) {
      return "Ya existe un registro con esos datos";
    }
    if (error.message.includes("Foreign key constraint")) {
      return "No se puede eliminar este registro porque está referenciado por otros datos";
    }
    if (error.message.includes("Record to update not found")) {
      return "El registro no fue encontrado";
    }
  }
  return "Error interno del servidor";
}