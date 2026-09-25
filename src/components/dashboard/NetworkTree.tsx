import { Link } from "react-router-dom";
import type { DrainNode, Gateway } from "@/types";

const STATUS_HEX: Record<string, string> = {
  online: "#4fd07a",
  warning: "#f0b13d",
  critical: "#ff5a5f",
  offline: "#5b6669",
};

export function NetworkTree({ gateway, nodes }: { gateway: Gateway; nodes: DrainNode[] }) {
  // group by hop count to build a simple layered mesh view
  const byHop = new Map<number, DrainNode[]>();
  nodes.forEach((n) => {
    const arr = byHop.get(n.hopCount) ?? [];
    arr.push(n);
    byHop.set(n.hopCount, arr);
  });
  const hops = [...byHop.keys()].sort((a, b) => a - b).slice(0, 4);

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-blue)]/15 text-[var(--color-blue)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
        <div>
          <p className="mono text-sm font-semibold text-[var(--color-text-0)]">{gateway.id}</p>
          <p className="text-xs text-[var(--color-text-2)]">{gateway.connectedNodes} nodes connected · mesh health {gateway.meshHealth}%</p>
        </div>
      </div>

      <div className="space-y-4">
        {hops.map((hop) => (
          <div key={hop} className="flex items-start gap-3">
            <div className="mono w-14 shrink-0 pt-1 text-[10px] text-[var(--color-text-2)]">HOP {hop}</div>
            <div className="flex flex-1 flex-wrap gap-1.5 border-l border-[var(--color-line)] pl-3">
              {(byHop.get(hop) ?? []).slice(0, 24).map((n) => (
                <Link
                  key={n.id}
                  to={`/nodes/${n.id}`}
                  title={`${n.id} · RSSI ${n.rssi}dBm · ${n.packetLoss}% loss`}
                  className="mono flex items-center gap-1 rounded border border-[var(--color-line)] bg-[var(--color-bg-1)] px-1.5 py-1 text-[10px] text-[var(--color-text-1)] hover:border-[var(--color-text-2)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_HEX[n.status] }} />
                  {n.id}
                </Link>
              ))}
              {(byHop.get(hop) ?? []).length > 24 && (
                <span className="mono self-center text-[10px] text-[var(--color-text-2)]">
                  +{(byHop.get(hop) ?? []).length - 24} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
