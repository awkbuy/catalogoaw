export const LEYENDA_SIN_IMPUESTOS = "PRECIO SIN IMPUESTOS NACIONALES";

export interface TaxConfig {
  iva: number;
  otrosImpuestosNacionales: number;
  activoCalculoAutomatico: boolean;
  mostrarPrecioSinImpuestos: boolean;
}

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  iva: 21,
  otrosImpuestosNacionales: 0,
  activoCalculoAutomatico: true,
  mostrarPrecioSinImpuestos: true,
};

export function parseTaxConfig(settings: Record<string, string>): TaxConfig {
  const parseNumero = (value: string | undefined, def: number): number => {
    if (!value || value.trim() === "") return def;
    const n = parseFloat(value.replace(",", "."));
    return Number.isFinite(n) ? n : def;
  };

  const parseBool = (value: string | undefined, def: boolean): boolean => {
    if (value === undefined || value.trim() === "") return def;
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "sí" || v === "si" || v === "on";
  };

  return {
    iva: parseNumero(settings.iva, DEFAULT_TAX_CONFIG.iva),
    otrosImpuestosNacionales: parseNumero(
      settings.otrosImpuestosNacionales,
      DEFAULT_TAX_CONFIG.otrosImpuestosNacionales
    ),
    activoCalculoAutomatico: parseBool(
      settings.activoCalculoAutomatico,
      DEFAULT_TAX_CONFIG.activoCalculoAutomatico
    ),
    mostrarPrecioSinImpuestos: parseBool(
      settings.mostrarPrecioSinImpuestos,
      DEFAULT_TAX_CONFIG.mostrarPrecioSinImpuestos
    ),
  };
}

export function redondearADosDecimales(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcularPrecioSinImpuestos(
  precioFinal: number,
  config: TaxConfig
): number {
  if (!config.activoCalculoAutomatico || precioFinal <= 0) return precioFinal;
  const totalImpuestos = config.iva + config.otrosImpuestosNacionales;
  if (totalImpuestos <= 0) return precioFinal;
  return redondearADosDecimales(precioFinal / (1 + totalImpuestos / 100));
}

export function formatPrecioConDecimales(value: number): string {
  return `$${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
