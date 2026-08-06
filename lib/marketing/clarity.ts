declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export function initClarity(projectId: string): void {
  if (typeof window === "undefined" || !projectId) return;
  if (typeof window.clarity !== "function") return;
  window.clarity("consent");
}

export function clarityEvent(name: string): void {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return;
  window.clarity("event", name);
}
