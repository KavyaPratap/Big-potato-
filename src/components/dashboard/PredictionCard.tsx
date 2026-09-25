import { Link } from "react-router-dom";
import type { Prediction } from "@/types";
import { RISK_COLORS } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function PredictionCard({ prediction }: { prediction: Prediction }) {
  const c = RISK_COLORS[prediction.risk];
  return (
    <div className={cn("rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4")}>
      <div className="flex items-center justify-between">
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", c.text, c.bg)}>
          {prediction.risk} risk
        </span>
        <span className="mono text-xs text-[var(--color-text-2)]">{prediction.nodeId}</span>
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <span className="mono text-3xl font-semibold text-[var(--color-text-0)]">{Math.round(prediction.probability * 100)}</span>
        <span className="mb-1 text-sm text-[var(--color-text-2)]">% blockage probability</span>
      </div>

      {prediction.predictedWindow && (
        <p className="mt-1 text-xs text-[var(--color-text-1)]">Predicted window: {prediction.predictedWindow}</p>
      )}
      <p className="text-xs text-[var(--color-text-2)]">Confidence: {Math.round(prediction.confidence * 100)}%</p>

      <ul className="mt-3 space-y-1">
        {prediction.factors.map((f, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-text-1)]">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-2)]" />
            {f}
          </li>
        ))}
      </ul>

      <Link to={`/nodes/${prediction.nodeId}`} className="mt-3 block">
        <Button size="sm" variant="secondary" className="w-full">
          View node
        </Button>
      </Link>
    </div>
  );
}

export function RiskMatrix({ counts }: { counts: Record<"low" | "medium" | "high" | "critical", number> }) {
  const order: Array<"low" | "medium" | "high" | "critical"> = ["low", "medium", "high", "critical"];
  return (
    <div className="grid grid-cols-4 gap-2">
      {order.map((r) => {
        const c = RISK_COLORS[r];
        return (
          <div key={r} className={cn("rounded-md p-3 text-center", c.bg)}>
            <p className={cn("mono text-xl font-semibold", c.text)}>{counts[r]}</p>
            <p className={cn("mt-0.5 text-[10px] font-medium uppercase tracking-wide", c.text)}>{r}</p>
          </div>
        );
      })}
    </div>
  );
}
