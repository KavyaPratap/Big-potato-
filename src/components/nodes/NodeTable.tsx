import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import type { DrainNode, NodeStatus, RiskLevel } from "@/types";
import { StatusBadge, RiskBadge } from "@/components/ui/StatusBadge";
import { SECTORS } from "@/data/mockData";
import { timeAgo } from "@/utils/format";
import { cn } from "@/lib/utils";

type SortKey = "id" | "waterLevel" | "methaneLEL" | "battery" | "rssi" | "lastSeen";

const PAGE_SIZE = 12;

export function NodeTable({ nodes }: { nodes: DrainNode[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<NodeStatus | "all">("all");
  const [sector, setSector] = useState<string>("all");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = nodes;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((n) => n.id.toLowerCase().includes(q) || n.sector.toLowerCase().includes(q));
    }
    if (status !== "all") list = list.filter((n) => n.status === status);
    if (sector !== "all") list = list.filter((n) => n.sector === sector);
    if (risk !== "all") list = list.filter((n) => n.risk === risk);
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortDir * av.localeCompare(bv);
      return sortDir * ((av as number) - (bv as number));
    });
  }, [nodes, query, status, sector, risk, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
    setPage(1);
  }

  const th = (label: string, key: SortKey) => (
    <th
      onClick={() => toggleSort(key)}
      className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-2)] hover:text-[var(--color-text-0)]"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </span>
    </th>
  );

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-2)]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search node ID or sector…"
            className="mono w-56 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] py-1.5 pl-8 pr-2 text-xs text-[var(--color-text-0)] placeholder:text-[var(--color-text-2)] focus:border-[var(--color-cyan)] focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as NodeStatus | "all");
            setPage(1);
          }}
          className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] px-2 py-1.5 text-xs text-[var(--color-text-1)] focus:border-[var(--color-cyan)] focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="online">Healthy</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="offline">Offline</option>
        </select>
        <select
          value={sector}
          onChange={(e) => {
            setSector(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] px-2 py-1.5 text-xs text-[var(--color-text-1)] focus:border-[var(--color-cyan)] focus:outline-none"
        >
          <option value="all">All sectors</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={risk}
          onChange={(e) => {
            setRisk(e.target.value as RiskLevel | "all");
            setPage(1);
          }}
          className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] px-2 py-1.5 text-xs text-[var(--color-text-1)] focus:border-[var(--color-cyan)] focus:outline-none"
        >
          <option value="all">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <span className="ml-auto text-xs text-[var(--color-text-2)]">{filtered.length} nodes</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-line)]">
              {th("Node ID", "id")}
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-2)]">Sector</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-2)]">Status</th>
              {th("Water", "waterLevel")}
              {th("CH4", "methaneLEL")}
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-2)]">H2S</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-2)]">Temp</th>
              {th("Battery", "battery")}
              {th("Signal", "rssi")}
              {th("Last seen", "lastSeen")}
              <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-2)]">Risk</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((n) => (
              <tr key={n.id} className="border-b border-[var(--color-line-soft)] hover:bg-[var(--color-bg-3)]/60">
                <td className="mono px-3 py-2 text-xs text-[var(--color-text-0)]">{n.id}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-xs text-[var(--color-text-1)]">{n.sector}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={n.status} />
                </td>
                <td className="mono px-3 py-2 text-xs text-[var(--color-text-1)]">{n.waterLevel}%</td>
                <td className="mono px-3 py-2 text-xs text-[var(--color-text-1)]">{n.methaneLEL}%</td>
                <td className="mono px-3 py-2 text-xs text-[var(--color-text-1)]">{n.h2sPpm}ppm</td>
                <td className="mono px-3 py-2 text-xs text-[var(--color-text-1)]">{n.temperature}°C</td>
                <td className="mono px-3 py-2 text-xs text-[var(--color-text-1)]">{n.battery}%</td>
                <td className="mono px-3 py-2 text-xs text-[var(--color-text-1)]">{n.rssi}dBm</td>
                <td className="px-3 py-2 text-xs text-[var(--color-text-2)]">{timeAgo(n.lastSeen)}</td>
                <td className="px-3 py-2">
                  <RiskBadge risk={n.risk} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link to={`/nodes/${n.id}`} className="text-xs font-medium text-[var(--color-cyan)] hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-10 text-center text-sm text-[var(--color-text-2)]">
                  No nodes match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-line)] px-3 py-2">
        <span className="text-xs text-[var(--color-text-2)]">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn("rounded p-1 text-[var(--color-text-1)] hover:bg-[var(--color-bg-3)]", page <= 1 && "opacity-30")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn("rounded p-1 text-[var(--color-text-1)] hover:bg-[var(--color-bg-3)]", page >= totalPages && "opacity-30")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
