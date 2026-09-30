import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock3, ShieldAlert, MapPin, UserCog } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { IncidentTimeline } from "@/components/tracking/IncidentTimeline";
import { useIncidentDetail } from "@/hooks/useDrainageData";

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
              <div className="flex items-center justify-between"><span>Resolution</span><strong>{incident.resolved_at ? "Closed" : "Open"}</strong></div>
            </div>
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
        </div>
      </div>
    </AppShell>
  );
}
