import { Link } from "react-router-dom";
import type { MaintenanceTask } from "@/types";
import { cn } from "@/lib/utils";

const priorityColor = {
  low: "text-[var(--color-ok)] bg-[var(--color-ok-dim)]",
  medium: "text-[var(--color-warn)] bg-[var(--color-warn-dim)]",
  high: "text-[var(--color-crit)] bg-[var(--color-crit-dim)]",
};

export function MaintenanceCard({ task }: { task: MaintenanceTask }) {
  return (
    <Link
      to={`/nodes/${task.nodeId}`}
      className="block rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4 transition-colors hover:border-[var(--color-text-2)]"
    >
      <div className="flex items-center justify-between">
        <span className="mono text-xs text-[var(--color-text-2)]">{task.nodeId}</span>
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", priorityColor[task.priority])}>
          {task.priority}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-[var(--color-text-0)]">{task.title}</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-1)]">{task.detail}</p>
      <p className="mt-2 text-xs font-medium text-[var(--color-cyan)]">{task.dueLabel}</p>
    </Link>
  );
}

export function Timeline({ events }: { events: { id: string; time: string; label: string; kind: "info" | "warning" | "critical" }[] }) {
  const dot = { info: "bg-[var(--color-blue)]", warning: "bg-[var(--color-warn)]", critical: "bg-[var(--color-crit)]" };
  return (
    <ol className="space-y-4">
      {events.map((e) => (
        <li key={e.id} className="relative pl-5">
          <span className={cn("absolute left-0 top-1.5 h-2 w-2 rounded-full", dot[e.kind])} />
          <p className="text-sm text-[var(--color-text-0)]">{e.label}</p>
          <p className="mono text-[11px] text-[var(--color-text-2)]">{e.time}</p>
        </li>
      ))}
    </ol>
  );
}
