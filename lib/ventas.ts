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

export interface PublicShippingZone {
  id: string;
  name: string;
  cost: number;
  freeFrom: number;
  consultar: boolean;
  active: boolean;
}

export interface EnvioResultado {
  gratis: boolean;
  desde?: number;
  freeFrom?: number;
  zonaGratis?: string;
  zonaDesde?: string;
  zonasConsultar?: string[];
}

export function getCuotasInfo(raw: Record<string, string>): CuotasInfo {
  const habilitadas = raw.cuotasHabilitadas !== "false";
  return {
    maxCuotas: habilitadas ? Math.max(0, Number(raw.cuotasMax) || 0) : 0,
    interesMensual: Math.max(0, Number(raw.cuotasInteresMensual) || 0),
    minimoPrecio: Math.max(0, Number(raw.cuotasMinimoPrecio) || 0),
  };
}

export function resolverEnvio(opts: {
  precio: number;
  envioGratisDelJuego?: boolean;
  zonas: PublicShippingZone[];
}): EnvioResultado | null {
  const { precio, envioGratisDelJuego, zonas } = opts;
  const activas = zonas.filter((z) => z.active);
  if (activas.length === 0) return null;

  const conTarifa = activas.filter((z) => !z.consultar);
  const zonasConsultar = activas.filter((z) => z.consultar).map((z) => z.name);
  const conCosto = conTarifa.filter((z) => z.cost > 0);

  if (envioGratisDelJuego) {
    return { gratis: true, zonaGratis: conTarifa[0]?.name, zonasConsultar };
  }

  const zonaUmbral = conTarifa.find((z) => z.freeFrom > 0 && precio >= z.freeFrom);
  if (zonaUmbral) {
    return { gratis: true, zonaGratis: zonaUmbral.name, zonasConsultar };
  }

  if (conCosto.length === 0) {
    return { gratis: true, zonaGratis: conTarifa[0]?.name, zonasConsultar };
  }

  const masBarata = [...conCosto].sort((a, b) => a.cost - b.cost)[0];
  const freeFrom = conTarifa
    .filter((z) => z.freeFrom > 0)
    .sort((a, b) => a.freeFrom - b.freeFrom)[0]?.freeFrom;

  return {
    gratis: false,
    desde: masBarata.cost,
    zonaDesde: masBarata.name,
    freeFrom,
    zonasConsultar,
  };
}

export interface CalculoEnvioCarrito {
  monto: number;
  gratis: boolean;
  zona: PublicShippingZone | null;
  motivo: "retiro" | "envio_gratis" | "descuento_umbral" | "costo" | "consultar";
}

export function calcularEnvioCarrito(opts: {
  subtotal: number;
  entrega: "retiro" | "envio" | null;
  zonaId: string | null;
  zonas: PublicShippingZone[];
  todosEnvioGratis: boolean;
}): CalculoEnvioCarrito | null {
  const { subtotal, entrega, zonaId, zonas, todosEnvioGratis } = opts;

  if (entrega === "retiro") {
    return { monto: 0, gratis: true, zona: null, motivo: "retiro" };
  }

  if (entrega === "envio" && todosEnvioGratis) {
    return { monto: 0, gratis: true, zona: null, motivo: "envio_gratis" };
  }

  if (entrega !== "envio") return null;

  const zona = zonas.find((z) => z.id === zonaId && z.active) ?? null;
  if (!zona) return null;

  if (zona.consultar) {
    return { monto: 0, gratis: false, zona, motivo: "consultar" };
  }

  if (zona.freeFrom > 0 && subtotal >= zona.freeFrom) {
    return { monto: 0, gratis: true, zona, motivo: "descuento_umbral" };
  }

  return { monto: zona.cost, gratis: false, zona, motivo: "costo" };
}
