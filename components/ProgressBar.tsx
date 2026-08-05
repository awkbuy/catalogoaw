"use client";

import { useProgress } from "@/lib/progress-context";

export default function ProgressBar() {
  const { visible, value } = useProgress();

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] h-1"
    >
      <div
        className="h-full bg-[#31D3A9] shadow-[0_0_8px_rgba(49,211,169,0.6)] transition-[width] duration-200 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
