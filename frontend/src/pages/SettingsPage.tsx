import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { SimulatedBadge } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import type { ThresholdConfig } from "@/types";

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  waterWarning: 65,
  waterCritical: 85,
  ch4Warning: 5,
  ch4Critical: 7.5,
  h2sWarning: 6,
  h2sCritical: 10,
  simulationSpeed: 1,
};

const SECTIONS = ["System", "Alerts", "Thresholds", "Simulation", "Network", "Display"] as const;

function Field({ label, value, unit, onChange }: { label: string; value: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] px-3 py-2.5">
      <span className="text-xs text-[var(--color-text-1)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mono w-20 rounded border border-[var(--color-line)] bg-[var(--color-bg-2)] px-2 py-1 text-right text-xs text-[var(--color-text-0)] focus:border-[var(--color-cyan)] focus:outline-none"
        />
        <span className="w-10 text-[11px] text-[var(--color-text-2)]">{unit}</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [active, setActive] = useState<(typeof SECTIONS)[number]>("Thresholds");

  return (
    <AppShell title="System Settings" subtitle="Demo configuration — not certified safety limits">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                active === s
                  ? "bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]"
                  : "text-[var(--color-text-1)] hover:bg-[var(--color-bg-3)] hover:text-[var(--color-text-0)]"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {active === "Thresholds" && (
            <Card>
              <CardHeader>
                <CardTitle>Demo thresholds</CardTitle>
                <SimulatedBadge />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-[var(--color-text-2)]">
                  These values drive the demo alert engine only. They are illustrative and not certified safety
                  limits — production deployment would require formally validated thresholds and Ex-rated hardware
                  certification (e.g. IECEx / CCOE) before use in a hazardous environment.
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Field label="Water level — warning" unit="%" value={thresholds.waterWarning} onChange={(v) => setThresholds((t) => ({ ...t, waterWarning: v }))} />
                  <Field label="Water level — critical" unit="%" value={thresholds.waterCritical} onChange={(v) => setThresholds((t) => ({ ...t, waterCritical: v }))} />
                  <Field label="CH4 — warning" unit="% LEL" value={thresholds.ch4Warning} onChange={(v) => setThresholds((t) => ({ ...t, ch4Warning: v }))} />
                  <Field label="CH4 — critical" unit="% LEL" value={thresholds.ch4Critical} onChange={(v) => setThresholds((t) => ({ ...t, ch4Critical: v }))} />
                  <Field label="H2S — warning" unit="ppm" value={thresholds.h2sWarning} onChange={(v) => setThresholds((t) => ({ ...t, h2sWarning: v }))} />
                  <Field label="H2S — critical" unit="ppm" value={thresholds.h2sCritical} onChange={(v) => setThresholds((t) => ({ ...t, h2sCritical: v }))} />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="ghost" onClick={() => setThresholds(DEFAULT_THRESHOLDS)}>Reset to defaults</Button>
                  <Button size="sm" variant="primary">Save demo thresholds</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {active === "System" && (
            <Card>
              <CardHeader><CardTitle>System</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--color-text-1)]">
                <p>Prototype architecture — designed for hazardous underground environments.</p>
                <p className="text-xs text-[var(--color-text-2)]">
                  Certification required for production deployment. This build ships frontend only; no backend, database, or live hardware connection is included.
                </p>
              </CardContent>
            </Card>
          )}

          {active === "Alerts" && (
            <Card>
              <CardHeader><CardTitle>Alerts</CardTitle></CardHeader>
              <CardContent className="text-sm text-[var(--color-text-1)]">
                Alert routing (SMS/email/webhook) is future backend work. This demo surfaces alerts in-app only.
              </CardContent>
            </Card>
          )}

          {active === "Simulation" && (
            <Card>
              <CardHeader>
                <CardTitle>Simulation</CardTitle>
                <SimulatedBadge />
              </CardHeader>
              <CardContent className="text-sm text-[var(--color-text-1)]">
                Use the Demo Data Controls panel on any node detail page to drive scenarios (rising water, blockage, gas alert, tamper, gateway offline) and control simulation speed.
              </CardContent>
            </Card>
          )}

          {active === "Network" && (
            <Card>
              <CardHeader><CardTitle>Network</CardTitle></CardHeader>
              <CardContent className="text-sm text-[var(--color-text-1)]">
                Gateway and mesh configuration will be managed here once a real gateway can be provisioned from the dashboard.
              </CardContent>
            </Card>
          )}

          {active === "Display" && (
            <Card>
              <CardHeader><CardTitle>Display</CardTitle></CardHeader>
              <CardContent className="text-sm text-[var(--color-text-1)]">
                Dark industrial theme (default). Light theme and unit preferences (metric/imperial) are planned.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
