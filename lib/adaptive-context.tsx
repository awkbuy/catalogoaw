"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import {
  type AdaptiveCapabilities,
  detectCapabilities,
  getCachedCapabilities,
  cacheCapabilities,
} from "@/lib/adaptive-ui";

const DEFAULT_CAPABILITIES: AdaptiveCapabilities = {
  profile: "premium",
  reducedMotion: false,
  hardwareConcurrency: 4,
  deviceMemory: null,
  backdropFilterSupport: true,
  detectedAt: 0,
};

interface AdaptiveSnapshot {
  caps: AdaptiveCapabilities;
  ready: boolean;
}

const DEFAULT_SNAPSHOT: AdaptiveSnapshot = {
  caps: DEFAULT_CAPABILITIES,
  ready: false,
};

let snapshot: AdaptiveSnapshot = DEFAULT_SNAPSHOT;
let initialized = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  ensureInitialized();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return DEFAULT_SNAPSHOT;
}

function emit() {
  listeners.forEach((cb) => cb());
}

function refresh() {
  const cached = getCachedCapabilities();
  const caps = cached ?? detectCapabilities();
  if (!cached) cacheCapabilities(caps);
  snapshot = { caps, ready: true };
  emit();
}

function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  refresh();
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", refresh);
}

interface AdaptiveContextValue extends AdaptiveCapabilities {
  isLite: boolean;
  isBalanced: boolean;
  isPremium: boolean;
  ready: boolean;
}

const AdaptiveContext = createContext<AdaptiveContextValue>({
  ...DEFAULT_CAPABILITIES,
  isLite: false,
  isBalanced: false,
  isPremium: true,
  ready: false,
});

export function AdaptiveProvider({ children }: { children: React.ReactNode }) {
  const { caps, ready } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const value: AdaptiveContextValue = {
    ...caps,
    isLite: caps.profile === "lite",
    isBalanced: caps.profile === "balanced",
    isPremium: caps.profile === "premium",
    ready,
  };

  return (
    <AdaptiveContext.Provider value={value}>
      {children}
    </AdaptiveContext.Provider>
  );
}

export function useAdaptive(): AdaptiveContextValue {
  return useContext(AdaptiveContext);
}
