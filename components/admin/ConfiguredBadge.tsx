import { Check } from "lucide-react";

export default function ConfiguredBadge({
  label = "Configurado",
}: {
  label?: string;
}) {
  return (
    <span
      data-testid="configured-badge"
      className="inline-flex items-center gap-1 rounded-full bg-[#31D3A9]/15 border border-[#31D3A9]/40 px-2 py-0.5 text-[11px] font-medium text-[#0B3B30] whitespace-nowrap"
    >
      <Check className="w-3 h-3" />
      {label}
    </span>
  );
}
