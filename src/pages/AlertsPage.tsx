import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AlertCard } from "@/components/alerts/AlertCard";
import { EmptyState, LoadingState } from "@/components/ui/Misc";
import { useAlerts } from "@/hooks/useDrainageData";
import { cn } from "@/lib/utils";
import type { Alert, AlertCategory, AlertSeverity } from "@/types";

type TabKey = "all" | "critical" | "warning" | "resolved" | "tamper" | "flood" | "gas" | "network";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "resolved", label: "Resolved" },
  { key: "tamper", label: "Tamper" },
  { key: "flood", label: "Flood" },
  { key: "gas", label: "Gas" },
  { key: "network", label: "Network" },
];

function matches(a: Alert, tab: TabKey): boolean {
  switch (tab) {
    case "all": return true;
    case "critical": return a.severity === ("critical" as AlertSeverity);
    case "warning": return a.severity === ("warning" as AlertSeverity);
    case "resolved": return a.status === "resolved";
    case "tamper": return a.category === ("tamper" as AlertCategory);
    case "flood": return a.category === ("flood" as AlertCategory);
    case "gas": return a.category === ("gas" as AlertCategory);
    case "network": return a.category === ("network" as AlertCategory);
    default: return true;
  }
}

export default function AlertsPage() {
  const { alerts, loading, acknowledge, resolve } = useAlerts();
  const [tab, setTab] = useState<TabKey>("all");

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: alerts.length, critical: 0, warning: 0, resolved: 0, tamper: 0, flood: 0, gas: 0, network: 0 };
    alerts.forEach((a) => {
      TABS.forEach((t) => {
        if (t.key !== "all" && matches(a, t.key)) c[t.key]++;
      });
    });
    return c;
  }, [alerts]);

  const filtered = alerts.filter((a) => matches(a, tab));

  return (
    <AppShell title="Alert Center" subtitle="All demo threshold breaches across the monitored network">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-line)] pb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.key
                  ? "bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]"
                  : "text-[var(--color-text-1)] hover:bg-[var(--color-bg-3)] hover:text-[var(--color-text-0)]"
              )}
            >
              {t.label}
              <span className="ml-1.5 text-[10px] text-[var(--color-text-2)]">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No alerts in this view" detail="Try another tab, or check back once the live simulation surfaces new events." />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map((a) => (
              <AlertCard key={a.id} alert={a} onAcknowledge={acknowledge} onResolve={resolve} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
