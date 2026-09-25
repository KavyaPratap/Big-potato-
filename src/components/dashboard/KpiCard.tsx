import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Trend } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";

export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  accent = "default",
  suffix,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: number;
  accent?: "default" | "ok" | "warn" | "crit" | "cyan";
  suffix?: string;
}) {
  const accentColor = {
    default: "text-[var(--color-text-1)] bg-[var(--color-bg-3)]",
    ok: "text-[var(--color-ok)] bg-[var(--color-ok-dim)]",
    warn: "text-[var(--color-warn)] bg-[var(--color-warn-dim)]",
    crit: "text-[var(--color-crit)] bg-[var(--color-crit-dim)]",
    cyan: "text-[var(--color-cyan)] bg-[var(--color-cyan)]/10",
  }[accent];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", accentColor)}>
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && <Trend value={trend} />}
      </div>
      <p className="mono mt-3 text-2xl font-semibold tabular-nums text-[var(--color-text-0)]">
        {value}
        {suffix && <span className="ml-0.5 text-sm font-normal text-[var(--color-text-2)]">{suffix}</span>}
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-text-2)]">{label}</p>
    </Card>
  );
}
