export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

const SESSION_STORAGE_KEY = "wr_utm_params";

export function captureUTMParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as UtmParams;
  } catch {
    // storage malformado o bloqueado; se intenta capturar de la URL
  }

  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    content: params.get("utm_content") || undefined,
    term: params.get("utm_term") || undefined,
  };

  if (utm.source || utm.medium || utm.campaign || utm.content || utm.term) {
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(utm));
    } catch {
      // storage lleno o bloqueado; el tracking sigue funcionando
    }
  }

  return utm;
}

export function getUTMParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UtmParams;
  } catch {
    // storage malformado; se ignora
  }
  return {};
}
