import type { Gateway } from "@/types";
import { Card } from "@/components/ui/Card";
import { LiveDot } from "@/components/ui/StatusBadge";
import { timeAgo } from "@/utils/format";
import { cn } from "@/lib/utils";

export function GatewayCard({ gateway }: { gateway: Gateway }) {
  const statusColor =
    gateway.status === "online" ? "var(--color-ok)" : gateway.status === "degraded" ? "var(--color-warn)" : "var(--color-crit)";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="mono text-sm font-semibold text-[var(--color-text-0)]">{gateway.id}</p>
          <p className="text-xs text-[var(--color-text-2)]">{gateway.label}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <LiveDot status={gateway.status === "online" ? "online" : gateway.status === "degraded" ? "warning" : "offline"} />
          <span className="text-xs font-medium uppercase" style={{ color: statusColor }}>
            {gateway.status}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {[
          { label: "Nodes connected", value: gateway.connectedNodes },
          { label: "Mesh health", value: `${gateway.meshHealth}%` },
          { label: "Backhaul", value: gateway.backhaulType },
          { label: "Uptime", value: gateway.uptime },
          { label: "Packet loss", value: `${gateway.packetLoss}%` },
          { label: "CPU / Mem", value: `${gateway.cpuLoad}% / ${gateway.memoryLoad}%` },
        ].map((r) => (
          <div key={r.label} className="rounded-md bg-[var(--color-bg-1)] px-2.5 py-2">
            <p className="text-[10px] text-[var(--color-text-2)]">{r.label}</p>
            <p className="mono mt-0.5 text-xs font-medium text-[var(--color-text-0)]">{r.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--color-text-2)]">
        <span>
          Packets rx/fwd: <span className="mono">{gateway.packetsReceived.toLocaleString()} / {gateway.packetsForwarded.toLocaleString()}</span>
        </span>
        <span className={cn(gateway.status !== "online" && "text-[var(--color-warn)]")}>Last sync {timeAgo(gateway.lastSync)}</span>
      </div>
    </Card>
  );
}
