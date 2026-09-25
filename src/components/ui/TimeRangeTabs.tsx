import { cn } from "@/lib/utils";

const RANGES = [
  { key: "1h", hours: 1, label: "1H" },
  { key: "6h", hours: 6, label: "6H" },
  { key: "24h", hours: 24, label: "24H" },
  { key: "7d", hours: 168, label: "7D" },
  { key: "30d", hours: 720, label: "30D" },
];

export function TimeRangeTabs({ value, onChange }: { value: string; onChange: (key: string, hours: number) => void }) {
  return (
    <div className="inline-flex rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key, r.hours)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === r.key
              ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]"
              : "text-[var(--color-text-2)] hover:text-[var(--color-text-0)]"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export { RANGES };
