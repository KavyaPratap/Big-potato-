import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus, Inbox, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-cyan)]",
        className
      )}
    >
      Simulated data
    </span>
  );
}

export function Trend({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const flat = Math.abs(value) < 0.05;
  const Icon = flat ? Minus : value > 0 ? TrendingUp : TrendingDown;
  const color = flat ? "text-[var(--color-text-2)]" : value > 0 ? "text-[var(--color-warn)]" : "text-[var(--color-ok)]";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", color)}>
      <Icon className="h-3 w-3" />
      {flat ? "steady" : `${value > 0 ? "+" : ""}${value.toFixed(1)}${suffix}`}
    </span>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <Inbox className="h-6 w-6 text-[var(--color-text-2)]" />
      <p className="text-sm font-medium text-[var(--color-text-1)]">{title}</p>
      {detail && <p className="max-w-xs text-xs text-[var(--color-text-2)]">{detail}</p>}
    </div>
  );
}

export function ErrorState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <AlertTriangle className="h-6 w-6 text-[var(--color-warn)]" />
      <p className="text-sm font-medium text-[var(--color-text-1)]">{title}</p>
      {detail && <p className="max-w-xs text-xs text-[var(--color-text-2)]">{detail}</p>}
    </div>
  );
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-[var(--color-bg-3)]" />
      ))}
    </div>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-[var(--color-text-2)]">{children}</p>;
}
