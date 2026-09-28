import { Link } from "react-router-dom";
import { Droplets, ArrowRight, Network, Radio } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-0)] text-[var(--color-text-0)]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
            <Droplets className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-[var(--color-text-1)]">SENTINEL</span>
        </div>

        <h1 className="mt-10 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Smart drainage monitoring for underground infrastructure.
        </h1>
        <p className="mt-4 max-w-lg text-base text-[var(--color-text-1)]">
          Real-time intelligence for manholes and sewer lines — water level, gas concentration, tilt and network
          health, from sensor node to dashboard.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4 border-y border-[var(--color-line)] py-6">
          {[
            { value: "200+", label: "Monitoring nodes" },
            { value: "24/7", label: "Infrastructure visibility" },
            { value: "AI", label: "Predictive maintenance" },
          ].map((s) => (
            <div key={s.label}>
              <p className="mono text-2xl font-semibold text-[var(--color-cyan)]">{s.value}</p>
              <p className="mt-1 text-xs text-[var(--color-text-2)]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-cyan)] px-4 py-2.5 text-sm font-semibold text-[#04211f] hover:bg-[var(--color-cyan)]/90"
          >
            Open monitoring dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/network"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-line)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-1)] hover:border-[var(--color-text-2)] hover:text-[var(--color-text-0)]"
          >
            <Network className="h-4 w-4" /> View system architecture
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-2 text-xs text-[var(--color-text-2)]">
          <Radio className="h-3.5 w-3.5 text-[var(--color-ok)]" />
          Prototype build — hackathon demonstration. Sensor data shown throughout is simulated.
        </div>
      </div>
    </div>
  );
}
