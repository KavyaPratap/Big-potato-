import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock3, ShieldAlert, MapPin, UserCog, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { IncidentTimeline } from "@/components/tracking/IncidentTimeline";
import { useIncidentDetail } from "@/hooks/useDrainageData";

const escalationChainFor = (category: string, priority: string) => {
  const base = [
    { step: 1, role: "Field Response Team", ministry: "Municipal Drainage Operations", channel: "SMS + in-app" },
    { step: 2, role: "Municipal Supervisor", ministry: "Greater Noida Municipal Corporation", channel: "Dashboard + dispatch" },
    { step: 3, role: "State Water Authority", ministry: "State Urban Water Department", channel: "Email + escalation alert" },
    { step: 4, role: "National oversight", ministry: "Ministry of Jal Shakti", channel: "Executive dashboard + briefing" },
  ];

  if (priority === "CRITICAL" || category.includes("FLOOD") || category.includes("METHANE") || category.includes("H2S")) {
    return base;
  }
  if (priority === "HIGH") {
    return base.slice(0, 3);
  }
  return base.slice(0, 2);
};

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
  const { incident, loading } = useIncidentDetail(incidentId);

  if (loading) {
    return (
      <AppShell title="Incident detail" subtitle="Loading response data">
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-2)] p-8 text-sm text-[var(--color-text-2)]">
          Loading incident details…
        </div>
      </AppShell>
    );
  }

  if (!incident) {
    return (
      <AppShell title="Incident detail" subtitle="Not found">
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-2)] p-8 text-sm text-[var(--color-text-2)]">
          Incident not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={incident.incident_number}
      subtitle={incident.title}
      headerActions={
        <Link to="/tracking" className="inline-flex items-center gap-2 rounded-md border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-text-1)] hover:bg-[var(--color-bg-3)]">
          <ArrowLeft className="h-4 w-4" />
          Back to tracking
        </Link>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] bg-[var(--color-cyan-dim)] text-[var(--color-cyan)]">
                {incident.category}
              </span>
              <span className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] bg-[var(--color-warn-dim)] text-[var(--color-warn)]">
                {incident.priority}
              </span>
              <span className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] bg-[var(--color-ok-dim)] text-[var(--color-ok)]">
                {incident.status}
              </span>
            </div>

            <p className="text-sm leading-6 text-[var(--color-text-1)]">{incident.description ?? "No incident description provided."}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] p-3">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-2)]"><MapPin className="h-3.5 w-3.5" /> Sector</p>
                <p className="mt-2 text-sm text-[var(--color-text-0)]">{incident.sector ?? "-"}</p>
              </div>
              <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] p-3">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-2)]"><Clock3 className="h-3.5 w-3.5" /> Detected</p>
                <p className="mt-2 text-sm text-[var(--color-text-0)]">{new Date(incident.detected_at).toLocaleString()}</p>
              </div>
              <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] p-3">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-2)]"><UserCog className="h-3.5 w-3.5" /> Assignment</p>
                <p className="mt-2 text-sm text-[var(--color-text-0)]">{incident.assigned_user_id ? `User ${incident.assigned_user_id}` : "Unassigned"}</p>
              </div>
            </div>
          </div>

          <IncidentTimeline events={incident.events ?? []} />
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
            <div className="mb-4 flex items-center gap-2 text-[var(--color-text-0)]">
              <ShieldAlert className="h-4 w-4 text-[var(--color-warn)]" />
              <p className="text-sm font-medium">Response status</p>
            </div>
            <div className="space-y-3 text-sm text-[var(--color-text-1)]">
              <div className="flex items-center justify-between"><span>Assigned team</span><strong>{incident.assigned_team_id ?? "Pending"}</strong></div>
              <div className="flex items-center justify-between"><span>Escalation</span><strong>{incident.priority}</strong></div>
              <div className="flex items-center justify-between"><span>Resolution</span><strong>{incident.status === "PRE_SOLVED" ? "Pre-solved" : incident.resolved_at ? "Closed" : "Open"}</strong></div>
              <div className="flex items-center justify-between"><span>Resolution method</span><strong>{incident.resolution_method ?? "Pending"}</strong></div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--color-text-0)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-ok)]" />
              <p className="text-sm font-medium">How it will be resolved</p>
            </div>
            <p className="text-sm leading-6 text-[var(--color-text-1)]">
              {incident.resolution_summary ?? "No resolution summary has been recorded yet."}
            </p>
            {incident.next_step && (
              <div className="mt-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] p-3 text-sm text-[var(--color-text-1)]">
                <span className="font-medium text-[var(--color-text-0)]">Next step:</span> {incident.next_step}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--color-text-0)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-ok)]" />
              <p className="text-sm font-medium">Evidence & notifications</p>
            </div>
            <ul className="space-y-2 text-sm text-[var(--color-text-1)]">
              <li>Evidence files: {incident.evidence?.length ?? 0}</li>
              <li>Notifications: {incident.notifications?.length ?? 0}</li>
              <li>Assignments: {incident.assignments?.length ?? 0}</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--color-text-0)]">
              <Building2 className="h-4 w-4 text-[var(--color-cyan)]" />
              <p className="text-sm font-medium">Escalation chain</p>
            </div>
            <div className="space-y-3">
              {escalationChainFor(incident.category, incident.priority).map((step) => (
                <div key={step.step} className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-1)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">Step {step.step}</p>
                    <span className="text-[10px] text-[var(--color-text-2)]">{step.channel}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[var(--color-text-0)]">{step.role}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-1)]">{step.ministry}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
