import { Link } from "react-router-dom";
import type { Alert } from "@/types";
import { SeverityBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/utils/format";
import { SEVERITY_COLORS } from "@/utils/format";
import { cn } from "@/lib/utils";

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
}: {
  alert: Alert;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}) {
  const c = SEVERITY_COLORS[alert.severity];
  return (
    <div className={cn("relative rounded-lg border bg-[var(--color-bg-2)] p-4 overflow-hidden", c.border, alert.severity === "critical" && "border-l-4 border-l-[var(--color-crit)]")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <span className="mono text-xs text-[var(--color-text-2)]">{alert.nodeId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-2)]">{timeAgo(alert.timestamp)}</span>
          {alert.status !== "active" && (
            <span className="rounded bg-[var(--color-bg-3)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-1)]">
              {alert.status}
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm font-medium text-[var(--color-text-0)]">{alert.title}</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-1)]">{alert.message}</p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-2)]">
        <span>Location: {alert.sector}</span>
        {alert.value !== undefined && (
          <span className="mono">
            Value: {alert.value}
            {alert.unit}
          </span>
        )}
        {alert.threshold !== undefined && (
          <span className="mono">
            Threshold: {alert.threshold}
            {alert.unit} (demo)
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Link to={`/nodes/${alert.nodeId}`}>
          <Button size="sm" variant="secondary">
            View node
          </Button>
        </Link>
        {alert.status === "active" && onAcknowledge && (
          <Button size="sm" variant="ghost" onClick={() => onAcknowledge(alert.id)}>
            Acknowledge
          </Button>
        )}
        {alert.status !== "resolved" && onResolve && (
          <Button size="sm" variant="ghost" onClick={() => onResolve(alert.id)}>
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}
