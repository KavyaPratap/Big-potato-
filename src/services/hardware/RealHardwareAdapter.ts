import type { HardwareAdapter } from "./HardwareAdapter";
import { ApiClient } from "@/services/api/ApiClient";
import type {
  Alert,
  DrainNode,
  Gateway,
  MaintenanceTask,
  NetworkTopology,
  SensorReading,
  SystemEvent,
} from "@/types";

export class RealHardwareAdapter implements HardwareAdapter {
  private readonly api: ApiClient;
  private readonly websocketUrl: string;
  private readonly listeners = new Set<(nodes: DrainNode[]) => void>();
  private socket: WebSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? "/api",
    websocketUrl: string = import.meta.env.VITE_TELEMETRY_WS_URL ?? ""
  ) {
    this.api = new ApiClient(baseUrl);
    this.websocketUrl = websocketUrl || this.defaultWebsocketUrl(baseUrl);
  }

  getNodes() {
    return this.api.get<DrainNode[]>("/nodes");
  }

  getNode(nodeId: string) {
    return this.api.get<DrainNode>(`/nodes/${encodeURIComponent(nodeId)}`);
  }

  getSensorHistory(nodeId: string, hours: number) {
    return this.api.get<SensorReading[]>(`/nodes/${encodeURIComponent(nodeId)}/readings?hours=${hours}`);
  }

  getAlerts() {
    return this.api.get<Alert[]>("/alerts");
  }

  acknowledgeAlert(alertId: string) {
    return this.api.post<void>(`/alerts/${encodeURIComponent(alertId)}/acknowledge`, {});
  }

  resolveAlert(alertId: string) {
    return this.api.post<void>(`/alerts/${encodeURIComponent(alertId)}/resolve`, {});
  }

  getGateways() {
    return this.api.get<Gateway[]>("/gateways");
  }

  getNetworkTopology() {
    return this.api.get<NetworkTopology>("/network/topology");
  }

  getMaintenanceTasks() {
    return this.api.get<MaintenanceTask[]>("/maintenance");
  }

  getSystemEvents() {
    return this.api.get<SystemEvent[]>("/events");
  }

  subscribeToLiveData(callback: (nodes: DrainNode[]) => void) {
    this.listeners.add(callback);
    this.connectTelemetry();
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        if (this.retryTimer) clearTimeout(this.retryTimer);
        this.retryTimer = null;
        this.socket?.close();
        this.socket = null;
      }
    };
  }

  private connectTelemetry() {
    if (this.socket || this.listeners.size === 0) return;
    this.socket = new WebSocket(this.websocketUrl);
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as DrainNode[] | { nodes?: DrainNode[]; data?: DrainNode[] };
        const nodes = Array.isArray(message) ? message : message.nodes ?? message.data;
        if (nodes) this.listeners.forEach((listener) => listener(nodes));
      } catch {
        // Ignore non-telemetry WebSocket messages.
      }
    };
    this.socket.onclose = () => {
      this.socket = null;
      if (this.listeners.size > 0) {
        this.retryTimer = setTimeout(() => {
          this.retryTimer = null;
          this.connectTelemetry();
        }, 3000);
      }
    };
  }

  private defaultWebsocketUrl(baseUrl: string) {
    if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
      const url = new URL(baseUrl);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = `${url.pathname.replace(/\/$/, "")}/../ws/telemetry`;
      return url.toString();
    }
    return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/telemetry`;
  }
}
