"use client";

interface DateRangeSelectorProps {
  days: number;
  onChange: (days: number) => void;
}

const OPTIONS = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];

export default function DateRangeSelector({ days, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.days}
          type="button"
          data-testid={`range-${opt.days}`}
          onClick={() => onChange(opt.days)}
          aria-pressed={days === opt.days}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            days === opt.days
              ? "bg-[#31D3A9] text-white shadow-sm"
              : "text-[#6B7280] hover:bg-[#E5E7EB]/50 hover:text-[#1F2937]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
