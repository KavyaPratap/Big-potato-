import { Play, RotateCcw, Gauge } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SimulatedBadge } from "@/components/ui/Misc";
import { useSimulation, SCENARIO_LABELS } from "@/hooks/useSimulation";
import type { SimulationScenario } from "@/types";
import { cn } from "@/lib/utils";
import { isMockHardware } from "@/services/hardware";

export function SimulationControl({ nodeId }: { nodeId?: string }) {
  const { scenario, setScenario, speed, setSpeed, reset } = useSimulation();

  if (!isMockHardware) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Data Controls</CardTitle>
        <SimulatedBadge />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-[var(--color-text-2)]">
          Drive the live simulation to demonstrate how the system reacts to a developing incident. All values shown across the app are synthetic.
        </p>

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-2)]">Scenario</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SCENARIO_LABELS) as SimulationScenario[]).map((key) => (
              <button
                key={key}
                onClick={() => setScenario(key, nodeId)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  scenario === key
                    ? "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]"
                    : "border-[var(--color-line)] text-[var(--color-text-1)] hover:border-[var(--color-text-2)]"
                )}
              >
                {SCENARIO_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-2)]">
            <Gauge className="h-3 w-3" /> Simulation speed
          </p>
          <div className="flex gap-1.5">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium",
                  speed === s
                    ? "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]"
                    : "border-[var(--color-line)] text-[var(--color-text-1)] hover:border-[var(--color-text-2)]"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="primary" onClick={() => setScenario("blockage", nodeId)}>
            <Play className="h-3.5 w-3.5" /> Run blockage simulation
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset demo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
