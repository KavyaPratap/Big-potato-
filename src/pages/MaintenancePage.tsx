import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { MaintenanceCard } from "@/components/dashboard/MaintenanceCard";
import { EmptyState } from "@/components/ui/Misc";
import { useMaintenanceTasks, useNodes } from "@/hooks/useDrainageData";

export default function MaintenancePage() {
  const tasks = useMaintenanceTasks();
  const { nodes } = useNodes();

  const summary = useMemo(() => {
    const offline = nodes.filter((n) => n.status === "offline").length;
    const lowBattery = nodes.filter((n) => n.battery < 25).length;
    const weakSignal = nodes.filter((n) => n.rssi < -85).length;
    const tampered = nodes.filter((n) => n.tampered).length;
    return { offline, lowBattery, weakSignal, tampered };
  }, [nodes]);

  const sorted = [...tasks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <AppShell title="Maintenance" subtitle="Calibration, battery, signal, and inspection queue">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Offline nodes", value: summary.offline },
            { label: "Low battery", value: summary.lowBattery },
            { label: "Weak signal", value: summary.weakSignal },
            { label: "Tamper events", value: summary.tampered },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="mono text-xl font-semibold text-[var(--color-text-0)]">{s.value}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-2)]">{s.label}</p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Maintenance queue</CardTitle></CardHeader>
          <CardContent>
            {sorted.length === 0 ? (
              <EmptyState title="Nothing needs attention" detail="All nodes are within demo maintenance thresholds." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((t) => (
                  <MaintenanceCard key={t.id} task={t} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
