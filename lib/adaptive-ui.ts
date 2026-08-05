export type Profile = "premium" | "balanced" | "lite";

export interface AdaptiveCapabilities {
  profile: Profile;
  reducedMotion: boolean;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  backdropFilterSupport: boolean;
  detectedAt: number;
}

function getReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getHardwareConcurrency(): number {
  return navigator.hardwareConcurrency ?? 2;
}

function getDeviceMemory(): number | null {
  if ("deviceMemory" in navigator) {
    return (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null;
  }
  return null;
}

function getBackdropFilterSupport(): boolean {
  return (
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)")
  );
}

function calculateProfile(signals: {
  reducedMotion: boolean;
  cpu: number;
  ram: number | null;
  backdropFilter: boolean;
}): Profile {
  if (signals.reducedMotion) return "lite";

  if (!signals.backdropFilter && signals.cpu < 4) return "lite";

  if (signals.cpu <= 2) return "lite";
  if (signals.ram !== null && signals.ram < 2) return "lite";

  if (signals.cpu <= 3) return "balanced";
  if (signals.ram !== null && signals.ram < 4) return "balanced";

  return "premium";
}

const STORAGE_KEY = "adaptive-profile";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function detectCapabilities(): AdaptiveCapabilities {
  const reducedMotion = getReducedMotion();
  const hardwareConcurrency = getHardwareConcurrency();
  const deviceMemory = getDeviceMemory();
  const backdropFilterSupport = getBackdropFilterSupport();

  const profile = calculateProfile({
    reducedMotion,
    cpu: hardwareConcurrency,
    ram: deviceMemory,
    backdropFilter: backdropFilterSupport,
  });

  return {
    profile,
    reducedMotion,
    hardwareConcurrency,
    deviceMemory,
    backdropFilterSupport,
    detectedAt: Date.now(),
  };
}

export function getCachedCapabilities(): AdaptiveCapabilities | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const caps: AdaptiveCapabilities = JSON.parse(raw);
    if (Date.now() - caps.detectedAt > CACHE_TTL) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return caps;
  } catch {
    return null;
  }
}

export function cacheCapabilities(caps: AdaptiveCapabilities): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(caps));
  } catch {
    // localStorage lleno o no disponible -- fail silencioso
  }
}

export function isLite(capabilities: AdaptiveCapabilities): boolean {
  return capabilities.profile === "lite";
}

export function isBalanced(capabilities: AdaptiveCapabilities): boolean {
  return capabilities.profile === "balanced";
}

export function isPremium(capabilities: AdaptiveCapabilities): boolean {
  return capabilities.profile === "premium";
}
