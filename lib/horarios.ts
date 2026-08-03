export interface DiaHorario {
  dia: number; // 0 = Domingo ... 6 = Sábado
  abierto: boolean;
  apertura: string; // "HH:MM"
  cierre: string; // "HH:MM"
}

export const DIAS_NOMBRES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const CLAVE_SETTING = "horarios_semana";

export function horariosPorDefecto(): DiaHorario[] {
  return [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
    dia,
    abierto: dia >= 1 && dia <= 5,
    apertura: "10:00",
    cierre: dia === 6 ? "14:00" : "20:00",
  }));
}

export function serializarHorarios(lista: DiaHorario[]): string {
  return JSON.stringify(lista);
}

export function parsearHorarios(json?: string | null): DiaHorario[] {
  if (!json) return horariosPorDefecto();
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return horariosPorDefecto();

    const map = new Map<number, DiaHorario>();
    for (const item of parsed) {
      const dia = Number(item?.dia);
      if (!Number.isInteger(dia) || dia < 0 || dia > 6) continue;
      map.set(dia, {
        dia,
        abierto: Boolean(item.abierto),
        apertura: typeof item.apertura === "string" ? item.apertura : "10:00",
        cierre: typeof item.cierre === "string" ? item.cierre : "20:00",
      });
    }

    return [0, 1, 2, 3, 4, 5, 6].map(
      (dia) => map.get(dia) ?? horariosPorDefecto()[dia]
    );
  } catch {
    return horariosPorDefecto();
  }
}

function minutos(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutosAHHMM(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type EstadoHorario = "abierto" | "por_cerrar" | "cerrado";

export interface EstadoInfo {
  estado: EstadoHorario;
  cierraHoy?: string;
  abreHoy?: string;
  faltanMin: number;
}

export function obtenerEstadoHorario(
  horarios: DiaHorario[],
  ahora = new Date()
): EstadoInfo {
  const dia = ahora.getDay();
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const hoy = horarios.find((h) => h.dia === dia);

  if (hoy?.abierto) {
    const apertura = minutos(hoy.apertura);
    const cierre = minutos(hoy.cierre);

    if (ahoraMin >= apertura && ahoraMin < cierre) {
      if (cierre - ahoraMin <= 30) {
        return {
          estado: "por_cerrar",
          cierraHoy: hoy.cierre,
          faltanMin: cierre - ahoraMin,
        };
      }
      return {
        estado: "abierto",
        cierraHoy: hoy.cierre,
        faltanMin: cierre - ahoraMin,
      };
    }
  }

  return {
    estado: "cerrado",
    abreHoy: hoy?.abierto ? hoy.apertura : undefined,
    cierraHoy: hoy?.abierto ? hoy.cierre : undefined,
    faltanMin: 0,
  };
}
