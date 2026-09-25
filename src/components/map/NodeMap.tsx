import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup } from "react-leaflet";
import { Link } from "react-router-dom";
import type { DrainNode, Gateway, NodeStatus } from "@/types";
import { SECTORS } from "@/data/mockData";
import { timeAgo } from "@/utils/format";
import "leaflet/dist/leaflet.css";

const STATUS_HEX: Record<NodeStatus, string> = {
  online: "#4fd07a",
  warning: "#f0b13d",
  critical: "#ff5a5f",
  offline: "#5b6669",
};
const GATEWAY_HEX = "#4d9fff";

export function NodeMap({ nodes, gateways }: { nodes: DrainNode[]; gateways: Gateway[] }) {
  const [statusFilter, setStatusFilter] = useState<NodeStatus | "all">("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return nodes.filter((n) => {
      if (statusFilter !== "all" && n.status !== statusFilter) return false;
      if (sectorFilter !== "all" && n.sector !== sectorFilter) return false;
      return true;
    });
  }, [nodes, statusFilter, sectorFilter]);

  const center: [number, number] = nodes.length
    ? [nodes[0].location.lat, nodes[0].location.lng]
    : [28.4595, 77.0266];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-[var(--color-line)]">
      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NodeStatus | "all")}
          className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-2)]/95 px-2 py-1.5 text-xs text-[var(--color-text-1)] shadow-lg focus:border-[var(--color-cyan)] focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="online">Healthy</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="offline">Offline</option>
        </select>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-2)]/95 px-2 py-1.5 text-xs text-[var(--color-text-1)] shadow-lg focus:border-[var(--color-cyan)] focus:outline-none"
        >
          <option value="all">All sectors</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-2)]/95 p-2.5 text-[11px] text-[var(--color-text-1)] shadow-lg">
        {Object.entries(STATUS_HEX).map(([k, hex]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: hex }} />
            <span className="capitalize">{k === "online" ? "healthy" : k}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GATEWAY_HEX }} />
          <span>gateway</span>
        </div>
      </div>

      <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LayerGroup>
          {gateways.map((g) => (
            <CircleMarker
              key={g.id}
              center={[g.location.lat, g.location.lng]}
              radius={9}
              pathOptions={{ color: GATEWAY_HEX, fillColor: GATEWAY_HEX, fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <div className="mono text-xs">
                  <p className="mb-1 text-sm font-semibold">{g.id}</p>
                  <p>Status: {g.status}</p>
                  <p>Nodes: {g.connectedNodes}</p>
                  <p>Mesh health: {g.meshHealth}%</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {filtered.map((n) => (
            <CircleMarker
              key={n.id}
              center={[n.location.lat, n.location.lng]}
              radius={6}
              pathOptions={{
                color: STATUS_HEX[n.status],
                fillColor: STATUS_HEX[n.status],
                fillOpacity: 0.85,
                weight: 1.5,
              }}
            >
              <Popup minWidth={220}>
                <div className="mono text-xs leading-relaxed">
                  <p className="mb-1 text-sm font-semibold">{n.id}</p>
                  <p>Status: {n.status.toUpperCase()}</p>
                  <p>Water level: {n.waterLevel}%</p>
                  <p>CH4: {n.methaneLEL}% LEL</p>
                  <p>H2S: {n.h2sPpm} ppm</p>
                  <p>Temperature: {n.temperature}°C</p>
                  <p>Humidity: {n.humidity}%</p>
                  <p>Battery: {n.battery}%</p>
                  <p>Signal: {n.rssi} dBm</p>
                  <p>Last seen: {timeAgo(n.lastSeen)}</p>
                  <p>Risk: {n.risk}</p>
                  <Link to={`/nodes/${n.id}`} className="mt-1.5 inline-block font-semibold text-[#2a9d99] underline">
                    View details →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </LayerGroup>
      </MapContainer>
    </div>
  );
}
