import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type SensorStatus = "normal" | "warning" | "critical";

const statusStyle: Record<SensorStatus, string> = {
  normal: "text-[var(--color-ok)] bg-[var(--color-ok-dim)]",
  warning: "text-[var(--color-warn)] bg-[var(--color-warn-dim)]",
  critical: "text-[var(--color-crit)] bg-[var(--color-crit-dim)]",
};

export function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  range,
  status,
  updatedAgo,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  range: string;
  status: SensorStatus;
  updatedAgo: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-text-2)]">
          <Icon className="h-3.5 w-3.5" />
          <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
        </div>
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", statusStyle[status])}>
          {status}
        </span>
      </div>
      <p className="mono mt-2 text-xl font-semibold text-[var(--color-text-0)]">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-[var(--color-text-2)]">{unit}</span>}
      </p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-text-2)]">
        <span>Normal: {range}</span>
        <span>{updatedAgo}</span>
      </div>
    </Card>
  );
}
