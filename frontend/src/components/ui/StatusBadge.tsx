import type { NodeStatus, RiskLevel, AlertSeverity } from "@/types";
import { STATUS_COLORS, RISK_COLORS, SEVERITY_COLORS, statusLabel } from "@/utils/format";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: NodeStatus; className?: string }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        c.text,
        c.bg,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {statusLabel(status)}
    </span>
  );
}

export function LiveDot({ status }: { status: NodeStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={cn("relative inline-flex h-2 w-2", c.text)}>
      <span className={cn("absolute inline-flex h-full w-full rounded-full pulse-ring", c.text)} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", c.dot)} />
    </span>
  );
}

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  const c = RISK_COLORS[risk];
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", c.text, c.bg, className)}>
      {risk}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: AlertSeverity; className?: string }) {
  const c = SEVERITY_COLORS[severity];
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", c.text, c.bg, c.border, className)}>
      {severity}
    </span>
  );
}
