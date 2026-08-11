export interface CuotasInfo {
  maxCuotas: number;
  interesMensual: number;
  minimoPrecio: number;
}

export interface CuotaCalculada {
  cuotas: number;
  valorCuota: number;
}

export function calcularCuotas(
  precioFinal: number,
  config: CuotasInfo
): CuotaCalculada | null {
  if (config.maxCuotas <= 0 || precioFinal <= 0 || precioFinal < config.minimoPrecio) {
    return null;
  }
  const interes = config.interesMensual > 0 ? config.interesMensual / 100 : 0;
  let valorCuota: number;
  if (interes > 0) {
    const factor = Math.pow(1 + interes, config.maxCuotas);
    valorCuota = (precioFinal * interes * factor) / (factor - 1);
  } else {
    valorCuota = precioFinal / config.maxCuotas;
  }
  return { cuotas: config.maxCuotas, valorCuota };
}
