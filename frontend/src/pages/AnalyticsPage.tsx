import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TimeRangeTabs } from "@/components/ui/TimeRangeTabs";
import { SimulatedBadge } from "@/components/ui/Misc";
import { useNodes, useAlerts, useGateways } from "@/hooks/useDrainageData";
import { SECTORS } from "@/data/mockData";

const axisProps = { stroke: "#6f7d81", tick: { fontSize: 10, fontFamily: "IBM Plex Mono" } };
const tooltipStyle = { background: "#12171a", border: "1px solid #232b2f", borderRadius: 8, fontSize: 12 };

export default function AnalyticsPage() {
  const { nodes } = useNodes();
  const { alerts } = useAlerts();
  const gateways = useGateways();
  const [rangeKey, setRangeKey] = useState("7d");

  const dynamicSectors = useMemo(() => Array.from(new Set(nodes.map((n) => n.sector))).sort(), [nodes]);

  const sectorData = useMemo(
    () =>
      dynamicSectors.map((s) => {
        const sectorNodes = nodes.filter((n) => n.sector === s);
        const avg = sectorNodes.length ? sectorNodes.reduce((sum, n) => sum + n.waterLevel, 0) / sectorNodes.length : 0;
        return { sector: s.split("—")[0].trim(), waterLevel: Math.round(avg * 10) / 10 };
      }),
    [nodes, dynamicSectors]
  );

  const batteryData = useMemo(
    () =>
      dynamicSectors.map((s) => {
        const sectorNodes = nodes.filter((n) => n.sector === s);
        const avg = sectorNodes.length ? sectorNodes.reduce((sum, n) => sum + (n.battery ?? 100), 0) / sectorNodes.length : 0;
        return { sector: s.split("—")[0].trim(), battery: Math.round(avg * 10) / 10 };
      }),
    [nodes, dynamicSectors]
  );

  const alertFrequency = useMemo(() => {
    const buckets = new Map<string, number>();
    alerts.forEach((a) => {
      const day = new Date(a.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    });
    return [...buckets.entries()].map(([day, count]) => ({ day, count })).slice(-14);
  }, [alerts]);

  const uptime = nodes.length ? ((nodes.filter((n) => n.status !== "offline").length / nodes.length) * 100).toFixed(1) : "0.0";
  const avgPacketLoss = nodes.length ? (nodes.reduce((s, n) => s + n.packetLoss, 0) / nodes.length).toFixed(1) : "0.0";
  const avgGatewayLoad = gateways.length ? (gateways.reduce((s, g) => s + g.cpuLoad, 0) / gateways.length).toFixed(0) : "0";

  return (
    <AppShell title="Analytics" subtitle="Trends across water level, gas, network, and infrastructure health">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <SimulatedBadge />
          <TimeRangeTabs value={rangeKey} onChange={(k) => setRangeKey(k)} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Node uptime", value: `${uptime}%` },
            { label: "Avg packet loss", value: `${avgPacketLoss}%` },
            { label: "Avg gateway load", value: `${avgGatewayLoad}%` },
            { label: "Alerts logged (14d)", value: String(alertFrequency.reduce((s, d) => s + d.count, 0)) },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="mono text-xl font-semibold text-[var(--color-text-0)]">{s.value}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-2)]">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Average water level by sector</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sectorData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#1a2023" vertical={false} />
                  <XAxis dataKey="sector" {...axisProps} />
                  <YAxis {...axisProps} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="waterLevel" fill="#4dd6d1" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Average battery health by sector</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={batteryData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#1a2023" vertical={false} />
                  <XAxis dataKey="sector" {...axisProps} />
                  <YAxis {...axisProps} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="battery" fill="#4fd07a" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Alert frequency</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={alertFrequency} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#1a2023" vertical={false} />
                  <XAxis dataKey="day" {...axisProps} />
                  <YAxis {...axisProps} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#f0b13d" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
