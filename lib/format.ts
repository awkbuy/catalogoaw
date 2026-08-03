export function parsePrice(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.,]/g, "");
  if (!cleaned) return 0;

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    const decimalSep = lastComma > lastDot ? "," : ".";
    const thousandsSep = decimalSep === "," ? "." : ",";
    const normalized = cleaned.split(thousandsSep).join("").replace(decimalSep, ".");
    return parseFloat(normalized) || 0;
  }

  if (lastComma !== -1) {
    return parseFloat(cleaned.replace(",", ".")) || 0;
  }

  return parseFloat(cleaned.replace(/\./g, "")) || 0;
}

export function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}
