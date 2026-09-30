import { ApiClient } from "@/services/api/ApiClient";
import type {
  Authority,
  EscalationRule,
  Incident,
  NotificationEvent,
  ResponseTeam,
  TrackingMapMarker,
  TrackingOverview,
  TrackingStatistics,
} from "@/types";

export class TrackingAdapter {
  private readonly api: ApiClient;

  constructor(baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? "/api") {
    this.api = new ApiClient(baseUrl);
  }

  getOverview() {
    return this.api.get<TrackingOverview>("/tracking/overview");
  }

  getIncidents() {
    return this.api.get<Incident[]>("/incidents");
  }

  getIncident(incidentId: string) {
    return this.api.get<Incident>(`/incidents/${encodeURIComponent(incidentId)}`);
  }

  getTrackingMap() {
    return this.api.get<TrackingMapMarker[]>("/tracking/map");
  }

  getStatistics() {
    return this.api.get<TrackingStatistics>("/tracking/statistics");
  }

  getAuthorities() {
    return this.api.get<Authority[]>("/authorities");
  }

  getResponseTeams() {
    return this.api.get<ResponseTeam[]>("/response-teams");
  }

  getNotifications() {
    return this.api.get<NotificationEvent[]>("/notifications");
  }

  getEscalationRules() {
    return this.api.get<EscalationRule[]>("/escalation-rules");
  }
}

export const trackingAdapter = new TrackingAdapter();
